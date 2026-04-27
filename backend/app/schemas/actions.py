# Client->server action models

# Placeholder for action models

from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal


class CreateGameRequest(BaseModel):
    """
    Create a lobby game.

    The lobby is created with exactly one player (the host). Other players must
    join explicitly via the join endpoint.
    """

    # Canonical field (new)
    player_name: Optional[str] = None
    # Backwards-compatibility for older clients (deprecated)
    player_ids: Optional[List[str]] = None

    @model_validator(mode="after")
    def _normalize(self) -> "CreateGameRequest":
        if self.player_name and self.player_ids:
            raise ValueError("Provide either player_name or player_ids, not both.")

        if self.player_name is not None:
            self.player_name = self.player_name.strip()
            if not self.player_name:
                raise ValueError("player_name is required.")
            return self

        if self.player_ids is not None:
            ids = [p.strip() for p in self.player_ids if p and p.strip()]
            if len(ids) != 1:
                raise ValueError(
                    "Create game requires exactly 1 host player. Others must join."
                )
            self.player_name = ids[0]
            self.player_ids = ids
            return self

        raise ValueError("player_name is required.")


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
