# Server->client response models (DTOs)

# Placeholder for response models

from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Literal
from ..services.player_view import PlayerView


class GameSummary(BaseModel):
    game_id: str
    player_ids: List[str]
    started: bool


class JoinGameResponse(BaseModel):
    player_id: str
    player_view: PlayerView


class PaymentTarget(BaseModel):
    player_id: str
    amount: int


class PaymentRequired(BaseModel):
    request_id: str
    receiver_id: str
    targets: List[PaymentTarget]


class PendingPrompt(BaseModel):
    pending_id: str
    target_player: str
    prompt: str


class DiscardRequired(BaseModel):
    player_id: str
    required_count: int


class GameOver(BaseModel):
    winner_id: str


class ResponseRequired(BaseModel):
    pending_requests: List[PendingPrompt]


class ActionResponse(BaseModel):
    status: Literal["ok", "error"]
    response_type: Literal[
        "action_resolved", "payment_required", "response_required", "discard_required"
    ]
    player_view: Optional[PlayerView] = None
    payment_request: Optional[PaymentRequired] = None
    response_required: Optional[ResponseRequired] = None
    discard_required: Optional[DiscardRequired] = None
    game_over: Optional[GameOver] = None
    message: Optional[str] = None
    log: Optional[Dict[str, Any]] = None


class PaymentResponse(BaseModel):
    status: Literal["ok", "error"]
    response_type: Literal["payment_applied"]
    player_view: Optional[PlayerView] = None
    game_over: Optional[GameOver] = None
    message: Optional[str] = None
    log: Optional[Dict[str, Any]] = None
