from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional


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


class PaymentParticipant(BaseModel):
    player_id: str
    amount: int
    status: Literal["pending", "paid", "partial", "canceled"] = "pending"
    request_id: Optional[str] = None
    paid_amount: int = 0


class PaymentTracker(BaseModel):
    group_id: str
    receiver_id: str
    source_player_id: str
    card_id: Optional[str] = None
    participants: List[PaymentParticipant] = Field(default_factory=list)


class GameState(BaseModel):
    id: str
    host_id: Optional[str] = None
    players: Dict[str, PlayerState]
    deck: DeckState
    current_player_id: Optional[str] = None
    turn_number: int = 1
    actions_taken: int = 0
    turn_actions: List[TurnAction] = Field(default_factory=list)
    payment_trackers: List[PaymentTracker] = Field(default_factory=list)
    winner_id: Optional[str] = None
    pending_actions: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


def resolve_host_id(state: GameState) -> Optional[str]:
    if state.host_id and state.host_id in state.players:
        return state.host_id
    return next(iter(state.players), None)


def find_payment_tracker(
    state: GameState, group_id: Optional[str]
) -> Optional[PaymentTracker]:
    if not group_id:
        return None
    for tracker in state.payment_trackers:
        if tracker.group_id == group_id:
            return tracker
    return None


def find_payment_tracker_by_request_id(
    state: GameState, request_id: str
) -> tuple[Optional[PaymentTracker], Optional[PaymentParticipant]]:
    for tracker in state.payment_trackers:
        for participant in tracker.participants:
            if participant.request_id == request_id:
                return tracker, participant
    return None, None


def upsert_payment_tracker(
    state: GameState,
    *,
    group_id: str,
    receiver_id: str,
    source_player_id: str,
    card_id: Optional[str],
    participants: List[Dict[str, Any]],
) -> PaymentTracker:
    tracker = find_payment_tracker(state, group_id)
    if tracker is None:
        tracker = PaymentTracker(
            group_id=group_id,
            receiver_id=receiver_id,
            source_player_id=source_player_id,
            card_id=card_id,
        )
        state.payment_trackers.append(tracker)

    tracker.receiver_id = receiver_id
    tracker.source_player_id = source_player_id
    tracker.card_id = card_id

    existing_by_player = {participant.player_id: participant for participant in tracker.participants}
    merged: List[PaymentParticipant] = []
    seen_player_ids: set[str] = set()

    for raw_participant in participants:
        player_id = str(raw_participant["player_id"])
        seen_player_ids.add(player_id)
        existing = existing_by_player.get(player_id)

        if existing is None:
            merged.append(PaymentParticipant.model_validate(raw_participant))
            continue

        if "amount" in raw_participant and raw_participant["amount"] is not None:
            existing.amount = int(raw_participant["amount"])
        if "status" in raw_participant and raw_participant["status"] is not None:
            existing.status = str(raw_participant["status"])
        if "request_id" in raw_participant:
            existing.request_id = raw_participant["request_id"]
        if "paid_amount" in raw_participant and raw_participant["paid_amount"] is not None:
            existing.paid_amount = int(raw_participant["paid_amount"])
        merged.append(existing)

    for player_id, participant in existing_by_player.items():
        if player_id not in seen_player_ids:
            merged.append(participant)

    tracker.participants = merged
    return tracker


def mark_payment_tracker_pending(
    state: GameState,
    *,
    group_id: str,
    player_id: str,
    request_id: str,
) -> None:
    tracker = find_payment_tracker(state, group_id)
    if tracker is None:
        return
    for participant in tracker.participants:
        if participant.player_id == player_id:
            participant.status = "pending"
            participant.request_id = request_id
            participant.paid_amount = 0
            return


def set_payment_tracker_status(
    state: GameState,
    *,
    group_id: str,
    player_id: str,
    status: Literal["pending", "paid", "partial", "canceled"],
    paid_amount: Optional[int] = None,
) -> None:
    tracker = find_payment_tracker(state, group_id)
    if tracker is None:
        return
    for participant in tracker.participants:
        if participant.player_id == player_id:
            participant.status = status
            participant.request_id = None if status != "pending" else participant.request_id
            if paid_amount is not None:
                participant.paid_amount = paid_amount
            elif status in {"paid", "partial", "canceled"}:
                participant.paid_amount = 0
            break
    prune_canceled_payment_trackers(state)


def prune_canceled_payment_trackers(state: GameState) -> None:
    state.payment_trackers = [
        tracker
        for tracker in state.payment_trackers
        if any(participant.status != "canceled" for participant in tracker.participants)
    ]
