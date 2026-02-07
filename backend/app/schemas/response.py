# Server->client response models (DTOs)

# Placeholder for response models

from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Literal
from engine.state import GameState


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


class ResponseRequired(BaseModel):
    pending_requests: List[PendingPrompt]


class ActionResponse(BaseModel):
    status: Literal["ok", "error"]
    response_type: Literal["action_resolved", "payment_required", "response_required"]
    state: Optional[GameState] = None
    payment_request: Optional[PaymentRequired] = None
    response_required: Optional[ResponseRequired] = None
    message: Optional[str] = None
    log: Optional[Dict[str, Any]] = None


class PaymentResponse(BaseModel):
    status: Literal["ok", "error"]
    response_type: Literal["payment_applied"]
    state: Optional[GameState] = None
    message: Optional[str] = None
    log: Optional[Dict[str, Any]] = None
