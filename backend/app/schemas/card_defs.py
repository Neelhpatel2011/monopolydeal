from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional, Literal
from pathlib import Path
import json


class RawEffect(BaseModel):
    type: str
    model_config = ConfigDict(extra="allow")  # keep other keys


class RawCard(BaseModel):
    id: str
    name: str
    type: str
    count: int
    bank_value: int

    colors: Optional[List[str]] = None
    property_group: Optional[str] = None
    effect: Optional[RawEffect] = None
    rent_by_count: Optional[List[int]] = None

    bankable: Optional[bool] = None
    image_url: Optional[str] = None
    restrictions: Optional[Dict[str, Any]] = None
    note: Optional[str] = None

    model_config = ConfigDict(extra="allow")  # keep any future fields


class PlayDef(BaseModel):
    effect: str
    params: Dict[str, Any] = Field(default_factory=dict)


class CardDef(BaseModel):
    id: str
    name: str
    kind: Literal["money", "property", "property_wild", "rent", "action"]
    copies: int
    money_value: int
    colors: Optional[List[str]] = None
    rent_by_count: Optional[List[int]] = None
    play: Optional[PlayDef] = None
    meta: Dict[str, Any] = Field(default_factory=dict)


# Convert RawCard to CardDef
def raw_to_carddef(raw: RawCard) -> Optional[CardDef]:
    kind_map = {
        "money": "money",
        "property": "property",
        "property_wild": "property_wild",
        "rent": "rent",
        "action": "action",
    }

    kind = kind_map.get(raw.type)
    if not kind:
        return None  # Unknown type

    play_def = None
    if raw.effect:
        play_def = PlayDef(
            effect=raw.effect.type,
            params={k: v for k, v in raw.effect.model_dump().items() if k != "type"},
        )

    card_def = CardDef(
        id=raw.id,
        name=raw.name,
        kind=kind,
        copies=raw.count,
        money_value=raw.bank_value,
        rent_by_count=raw.rent_by_count,
        colors=raw.colors,
        play=play_def,
        meta={
            "property_group": raw.property_group,
            "bankable": raw.bankable,
            "image_url": raw.image_url,
            "restrictions": raw.restrictions,
            "note": raw.note,
        },
    )

    return card_def
