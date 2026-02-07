# Client->server action models

# Placeholder for action models

from typing import List
from pydantic import BaseModel, Field, ConfigDict, Literal, Optional


class ChangeWildPayload(BaseModel):
    card_id: str
    new_color: str


class PaymentRequest(BaseModel):
    request_id: str
    payer_id: str
    receiver_id: str
    bank: List[str] = Field(default_factory=list)
    properties: List[str] = Field(default_factory=list)
    buildings: List[str] = Field(default_factory=list)


class ActionRequest(BaseModel):
    action_type: Literal["play_card", "change_wild", "discard", "end_turn"]
    player_id: str
    card_id: Optional[str] = None

    # rent
    rent_color: Optional[str] = None
    double_rent_ids: List[str] = Field(default_factory=list)

    # targeting
    target_player_id: Optional[str] = None

    # property manipulation
    steal_card_id: Optional[str] = None
    give_card_id: Optional[str] = None
    steal_color: Optional[str] = None

    # change wild
    change_wild: Optional[ChangeWildPayload] = None

    # discard
    discard_ids: List[str] = Field(default_factory=list)
