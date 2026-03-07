from pydantic import BaseModel, Field, model_validator
from typing import Any, Dict, List, Optional
from ..engine.state import GameState


class PendingActionPrompt(BaseModel):
    pending_id: str
    source_player: str
    card_id: str
    prompt: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class TurnActionView(BaseModel):
    player_id: str
    action_type: str
    card_ids: List[str] = Field(default_factory=list)


class PlayerPublicView(BaseModel):
    id: str
    hand_count: int = 0
    bank: List[str] = Field(default_factory=list)
    properties: Dict[str, List[str]] = Field(default_factory=dict)
    buildings: Dict[str, List[str]] = Field(default_factory=dict)


class PlayerPrivateView(PlayerPublicView):
    hand: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _sync_hand_count(self) -> "PlayerPrivateView":
        self.hand_count = len(self.hand)
        return self


class PlayerView(BaseModel):
    game_id: str
    you: PlayerPrivateView
    others: List[PlayerPublicView] = Field(default_factory=list)
    pending_prompts: List[PendingActionPrompt] = Field(default_factory=list)
    turn_actions: List[TurnActionView] = Field(default_factory=list)
    deck_count: int
    discard_pile: List[str] = Field(default_factory=list)
    current_player_id: Optional[str] = None
    turn_number: int = 1
    actions_taken: int = 0
    game_over: Optional[Dict[str, str]] = None


def build_player_view(state: GameState, player_id: str) -> PlayerView:
    """Takes in the gamestate and the player id that we want to transform the view for each player and send to their websocket connection"""

    if player_id not in state.players:
        raise ValueError("Player not found")

    game_id = state.id

    current_player_state = state.players[player_id]
    player_private_view = PlayerPrivateView(**current_player_state.model_dump())

    others = []
    for pid, other_player_state in state.players.items():
        if pid == player_id:
            continue

        data = other_player_state.model_dump()
        private = PlayerPrivateView(**data)  # hand_count computed
        player_public_view = PlayerPublicView(
            **private.model_dump(exclude={"hand"})
        )  # don't put the hand field in the public view
        others.append(player_public_view)

    pending_prompts: List[PendingActionPrompt] = []
    for pending_id, pending in state.pending_actions.items():
        if pending.get("awaiting_player") != player_id:
            continue

        prompt = (
            "Accept or Just Say No?"
            if int(pending.get("jsn_count") or 0) == 0
            else "Opponent played Just Say No. Counter?"
        )
        pending_prompts.append(
            PendingActionPrompt(
                pending_id=pending_id,
                source_player=str(pending.get("source_player") or ""),
                card_id=str(pending.get("card_id") or ""),
                prompt=prompt,
                payload=dict(pending.get("payload") or {}),
            )
        )

    return PlayerView(
        game_id=game_id,
        you=player_private_view,
        others=others,
        pending_prompts=pending_prompts,
        turn_actions=[
            TurnActionView.model_validate(
                a.model_dump() if hasattr(a, "model_dump") else a
            )
            for a in (state.turn_actions or [])
        ],
        deck_count=len(state.deck.draw_pile),
        discard_pile=state.deck.discard_pile,
        current_player_id=state.current_player_id,
        turn_number=state.turn_number,
        actions_taken=state.actions_taken,
        game_over=({"winner_id": state.winner_id} if state.winner_id else None),
    )
