# Client->server action models

# Placeholder for action models

from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class CreateGameRequest(BaseModel):
    player_ids: List[str]


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


class PendingResponseRequest(BaseModel):
    pending_id: str
    player_id: str
    response: Literal["accept", "just_say_no"]


class ActionRequest(BaseModel):
    action_type: Literal[
        "play_bank",
        "play_property",
        "change_wild",
        "discard",
        "end_turn",
        "play_action_counterable",
        "play_action_non_counterable",
    ]
    player_id: str

    # card ids
    card_id: Optional[str] = None
    bank_card_id: Optional[str] = None
    property_card_id: Optional[str] = None

    # property placement
    property_color: Optional[str] = None

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
