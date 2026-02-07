# Placeholder for steal effect logic
## Process Property Manipulation

from typing import Dict, Optional, Any


def get_set_size(color: str) -> int:
    if "RENT_TABLE" not in globals():
        raise ValueError(
            "RENT_TABLE is not defined. Build it once before property actions."
        )
    if color not in RENT_TABLE:
        raise ValueError(f"No rent table for color '{color}'.")
    return len(RENT_TABLE[color])


def is_full_set(player: PlayerState, color: str) -> bool:
    return len(player.properties.get(color, [])) >= get_set_size(color)


def find_card_color(properties: Dict[str, List[str]], card_id: str) -> str:
    for color, cards in properties.items():
        if card_id in cards:
            return color
    raise ValueError(f"Card id {card_id} not found in properties.")


def process_property_manipulation(
    state: GameState,
    catalog: Dict[str, CardDef],
    actor_id: str,
    action_card_id: str,
    target_player_id: str,
    *,
    steal_card_id: Optional[str] = None,  # Sly Deal & Forced Deal
    give_card_id: Optional[str] = None,  # Forced Deal
    steal_color: Optional[str] = None,  # Deal Breaker (full set)
) -> Dict[str, Any]:

    if actor_id not in state.players:
        raise ValueError(f"Unknown actor_id: {actor_id}")
    if target_player_id not in state.players:
        raise ValueError(f"Unknown target_player_id: {target_player_id}")
    if actor_id == target_player_id:
        raise ValueError("Cannot target yourself.")

    actor = state.players[actor_id]
    target = state.players[target_player_id]

    if action_card_id not in catalog:
        raise ValueError(f"Unknown card id: {action_card_id}")

    action_card = catalog[action_card_id]
    if action_card.kind != "action" or not action_card.play:
        raise ValueError("Card is not a playable action.")

    effect = action_card.play.effect
    params = action_card.play.params

    ## Deal Breaker Logic

    if effect == "steal_full_set":
        if not steal_color:
            raise ValueError("steal_color is required for Deal Breaker.")
        if not is_full_set(target, steal_color):
            raise ValueError(f"Target does not have a full set of '{steal_color}'.")

        stolen_cards = target.properties.get(steal_color, [])
        target.properties[steal_color] = []  # The target loses the full set
        actor.properties.setdefault(steal_color, []).extend(
            stolen_cards
        )  # The actor gains the full set

        # Handle any building transfers if needed:
        if params.get("includes_buildings"):
            b = target.buildings.get(steal_color, [])
            target.buildings[steal_color] = []
            actor.buildings.setdefault(steal_color, []).extend(b)

        return {
            "type": "steal_full_set",
            "actor_id": actor_id,
            "target_id": target_player_id,
            "color": steal_color,
            "cards": stolen_cards,
        }
    ## Sly Deal Logic

    if effect == "steal_property":
        if not steal_card_id:
            raise ValueError("steal_card_id is required for Sly Deal.")
        steal_color_actual = find_card_color(target.properties, steal_card_id)

        if not params.get("from_full_set_allowed", False) and is_full_set(
            target, steal_color_actual
        ):
            raise ValueError("Cannot steal from a full set.")

        target.properties[steal_color_actual].remove(steal_card_id)
        actor.properties.setdefault(steal_color_actual, []).append(steal_card_id)

        return {
            "type": "steal_property",
            "actor_id": actor_id,
            "target_id": target_player_id,
            "card_id": steal_card_id,
            "color": steal_color_actual,
        }
    ## Forced Deal Logic

    if effect == "swap_property":
        if not steal_card_id or not give_card_id:
            raise ValueError(
                "steal_card_id and give_card_id are required for Forced Deal."
            )

        steal_color_actual = find_card_color(target.properties, steal_card_id)
        give_color_actual = find_card_color(actor.properties, give_card_id)

        if not params.get("from_full_set_allowed", False):
            if is_full_set(target, steal_color_actual):
                raise ValueError("Cannot take from target full set.")
            if is_full_set(actor, give_color_actual):
                raise ValueError("Cannot give from your full set.")

        target.properties[steal_color_actual].remove(steal_card_id)
        actor.properties[give_color_actual].remove(give_card_id)

        actor.properties.setdefault(steal_color_actual, []).append(steal_card_id)
        target.properties.setdefault(give_color_actual, []).append(give_card_id)

        return {
            "type": "swap_property",
            "actor_id": actor_id,
            "target_id": target_player_id,
            "stolen_card_id": steal_card_id,
            "given_card_id": give_card_id,
            "stolen_color": steal_color_actual,
            "given_color": give_color_actual,
        }

    raise ValueError(f"Unsupported property manipulation effect: {effect}")
