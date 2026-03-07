from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


class DeckState(BaseModel):
    draw_pile: List[str] = Field(default_factory=list)
    discard_pile: List[str] = Field(default_factory=list)


class PlayerState(BaseModel):
    id: str
    hand: List[str] = Field(default_factory=list)  # card ids
    bank: List[str] = Field(default_factory=list)  # card ids
    properties: Dict[str, List[str]] = Field(default_factory=dict)  # color -> card ids
    buildings: Dict[str, List[str]] = Field(
        default_factory=dict
    )  # color -> building card ids


class TurnAction(BaseModel):
    """A public, per-turn action stack entry for the UI."""

    player_id: str
    action_type: str
    card_ids: List[str] = Field(default_factory=list)


class GameState(BaseModel):
    id: str
    players: Dict[str, PlayerState]
    deck: DeckState
    current_player_id: Optional[str] = None
    turn_number: int = 1
    actions_taken: int = 0
    turn_actions: List[TurnAction] = Field(default_factory=list)
    winner_id: Optional[str] = None
    pending_actions: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
