# Placeholder for rent effect logic

## Charge Rent and building bonus rent calculation!
from collections import Counter
from typing import List, Optional

from ..state import GameState
from ...services.card_catalog import CardCatalog


# Add extra rent if you have a building in a appropriate full property set
# Can only have houses and then hotels on a full property set
# No houses or hotels on railroads or utilities


def building_bonus_for_color(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    color: str,
) -> int:
    bonus = 0
    for bid in state.players[player_id].buildings.get(color, []):
        cd = catalog.cards[bid]
        if cd.play and cd.play.effect == "building":
            bonus += int(cd.play.params.get("rent_bonus", 0))
    return bonus


def charge_rent_amount(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    rent_card_id: str,
    color: str,
    double_rent_ids: Optional[List[str]] = None,
    require_in_hand: bool = True,
) -> int:
    rent_table = catalog.rent_table

    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")
    player = state.players[player_id]

    # Ensure player has the rent card + any double rent cards
    if require_in_hand:
        hand_counts = Counter(player.hand)
        play_ids = [rent_card_id] + (double_rent_ids or [])
        play_counts = Counter(play_ids)
        for cid, cnt in play_counts.items():
            if cnt > hand_counts.get(cid, 0):
                raise ValueError(f"Player does not have {cnt} copies of {cid} in hand.")

    # Validate rent card
    if rent_card_id not in catalog.cards:
        raise ValueError(f"Unknown card id: {rent_card_id}")
    rent_card = catalog.cards[rent_card_id]
    if rent_card.kind != "rent":
        raise ValueError("Card is not a rent card.")

    # Validate color choice
    allowed_colors = rent_card.colors or []
    if "any" not in allowed_colors and color not in allowed_colors:
        raise ValueError(f"Rent card cannot be used for color '{color}'.")

    # Base rent from RENT_TABLE
    if color not in rent_table:
        raise ValueError(f"No rent table defined for color '{color}'.")
    rent_steps = rent_table[color]
    if not rent_steps:
        raise ValueError(f"Rent table for '{color}' is empty.")

    prop_count = len(player.properties.get(color, []))
    if prop_count == 0:
        raise ValueError(f"Player has no properties in color '{color}'.")
    step_index = min(prop_count, len(rent_steps)) - 1
    base_rent = rent_steps[step_index]

    # Apply Building bonus only on full sets
    # only allow building bonus if full set
    full_set = prop_count >= len(rent_steps)
    bonus = (
        building_bonus_for_color(state, catalog, player_id, color) if full_set else 0
    )

    # Apply Double The Rent modifiers (stackable)
    multiplier = 1
    for dr_id in double_rent_ids or []:
        if dr_id not in catalog.cards:
            raise ValueError(f"Unknown card id: {dr_id}")
        dr = catalog.cards[dr_id]

        if dr.kind != "action" or not dr.play:
            raise ValueError(f"{dr_id} is not a valid Double The Rent card.")

        if dr.play.effect != "modifier" or dr.play.params.get("applies_to") != "rent":
            raise ValueError(f"{dr_id} is not a valid rent modifier.")
        multiplier *= int(dr.play.params.get("multiplier", 2))

    return (base_rent + bonus) * multiplier
