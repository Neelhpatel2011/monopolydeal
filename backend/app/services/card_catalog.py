# Loads + validates cards from files

# Placeholder for card catalog logic

from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional, Literal
from pathlib import Path
import json

from backend.app.schemas.card_defs import RawCard, CardDef, raw_to_carddef


# Load card definitions from JSON files in a directory
def load_card_defs_from_dir(cards_dir: str) -> Dict[str, CardDef]:
    catalog: Dict[str, CardDef] = {}

    for path in Path(cards_dir).glob("*.json"):
        raw_data = json.loads(path.read_text(encoding="utf-8"))

        # Normalize to a list
        if isinstance(raw_data, list):
            raw_cards = [RawCard.model_validate(item) for item in raw_data]
        else:
            raw_cards = [RawCard.model_validate(raw_data)]

        for rc in raw_cards:
            cd = raw_to_carddef(rc)
            if cd is None:
                continue
            if cd.id in catalog:
                raise ValueError(f"Duplicate card ID found: {cd.id}")
            catalog[cd.id] = cd

    return catalog


# Build the Rent Table from the card catalog (ONLY ONCE PER GAME)
def build_rent_table(catalog: Dict[str, CardDef]) -> Dict[str, List[int]]:
    rent_table: Dict[str, List[int]] = {}
    for card_def in catalog.values():
        if (
            card_def.kind == "property"
            and card_def.meta.get("property_group")
            and card_def.rent_by_count
        ):
            # All properties in a group should have same rent_by_count
            rent_table[card_def.meta["property_group"]] = card_def.rent_by_count
    return rent_table
