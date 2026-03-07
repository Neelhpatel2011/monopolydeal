# Placeholder for game rules logic
## Play Bank
import uuid
from collections.abc import Iterable
from typing import Any, Dict, List, Optional

from .state import GameState, PlayerState, DeckState, TurnAction
from ..schemas.card_defs import CardDef
from ..schemas.response import ActionResponse
from ..services.card_catalog import CardCatalog
from .effects.draw import draw_cards
from .effects.rent import charge_rent_amount
from .effects.steal import process_property_manipulation, find_card_color, is_full_set


## Use Action
def ensure_action_available(state: GameState, max_actions: int = 3) -> None:
    if state.actions_taken >= max_actions:
        raise ValueError("No actions remaining this turn.")


def consume_action(state: GameState) -> None:
    state.actions_taken += 1


def record_turn_action(
    state: GameState,
    *,
    player_id: str,
    action_type: str,
    card_ids: List[str],
) -> None:
    state.turn_actions.append(
        TurnAction(
            player_id=player_id,
            action_type=action_type,
            card_ids=[cid for cid in card_ids if cid],
        )
    )


def end_turn(state: GameState, turn_order: List[str]) -> GameState:

    if not turn_order:
        raise ValueError("turn_order is empty.")
    if state.current_player_id not in turn_order:
        raise ValueError("current_player_id not found in turn_order.")

    idx = turn_order.index(state.current_player_id)
    next_idx = (idx + 1) % len(turn_order)

    next_player_id = turn_order[next_idx]
    state.current_player_id = next_player_id
    state.turn_number += 1
    state.actions_taken = 0
    state.turn_actions = []

    # Monopoly Deal rule: at the start of each player's turn, they draw 2 cards.
    # TODO: If we ever add character cards that have different draw card patterns, we can add them here by changing n = X
    draw_cards(state, next_player_id, n=2)

    return state


## Discard Cards
def discard_cards(
    state: GameState, player_id: str, card_ids: Iterable[str]
) -> GameState:
    """ "
    Card_ids function argument is the card ids to be discarded from the player's hand that the player chooses to discard.
    We take this directly from the UI and input it into the engine to update the game state.
    """
    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")

    hand = state.players[player_id].hand
    for cid in card_ids:
        if cid not in hand:
            raise ValueError(f"Player {player_id} does not have card {cid} in hand.")
        hand.remove(cid)
        state.deck.discard_pile.append(cid)

    return state


# Discard Action Cards
def discard_action_cards(
    state: GameState, actor: PlayerState, card_ids: List[str]
) -> None:
    for cid in card_ids:
        if cid not in actor.hand:
            raise ValueError(f"Card {cid} not in hand.")
        actor.hand.remove(cid)
        state.deck.discard_pile.append(cid)


def count_complete_sets(player: PlayerState, set_sizes: Dict[str, int]) -> int:
    complete = 0
    for color, cards in player.properties.items():
        needed = set_sizes.get(color)
        if needed is not None and len(cards) >= needed:
            complete += 1
    return complete


def check_win(state: GameState, catalog: CardCatalog) -> Optional[str]:
    set_sizes = {color: len(rents) for color, rents in catalog.rent_table.items()}
    for player_id, player in state.players.items():
        if count_complete_sets(player, set_sizes) >= 3:
            return player_id
    return None


# Play Bank Cards
def play_bank(
    state: GameState,
    player_id: str,
    card_id: str,
    catalog: CardCatalog,
) -> None:

    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")

    player = state.players[player_id]

    if card_id not in player.hand:
        raise ValueError("Card not in player hand.")

    if card_id not in catalog.cards:
        raise ValueError(f"Unknown card id: {card_id}")

    cd = catalog.cards[card_id]

    # House rule for this implementation: properties cannot be banked.
    if cd.kind in {"property", "property_wild"}:
        raise ValueError("Property cards cannot be banked.")

    if cd.meta.get("bankable") is False:
        raise ValueError("This card cannot be banked.")

    if cd.money_value <= 0:
        raise ValueError("This card has no money value and cannot be banked.")

    # Move from hand -> bank
    player.hand.remove(card_id)
    player.bank.append(card_id)

    return None


## Play Property
def play_property(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    card_id: str,
    color_if_wild: Optional[str] = None,
) -> None:

    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")

    player = state.players[player_id]

    if card_id not in player.hand:
        raise ValueError("Card not in player hand.")

    if card_id not in catalog.cards:
        raise ValueError(f"Unknown card id: {card_id}")

    cd = catalog.cards[card_id]

    if cd.kind not in {"property", "property_wild"}:
        raise ValueError("Card is not a property or a wild property.")

    if not cd.colors:
        raise ValueError("Property card has no colors defined.")

    # Choose color
    if cd.kind == "property":
        # If only one color, auto-use it unless a different color was passed

        if len(cd.colors) == 1:
            chosen_color = cd.colors[0]
            if color_if_wild and color_if_wild != chosen_color:
                raise ValueError(f"Invalid color '{color_if_wild}' for this property.")
        else:
            # Multi-color property behaves like wild; require explicit choice
            if not color_if_wild or color_if_wild not in cd.colors:
                raise ValueError("Must choose a valid color for this property.")
            chosen_color = color_if_wild
    else:
        # property_wild: must choose one of its colors
        if not color_if_wild or color_if_wild not in cd.colors:
            raise ValueError("Must choose a valid color for a wild property.")
        chosen_color = color_if_wild

    # Move card to properties
    player.hand.remove(card_id)
    player.properties.setdefault(chosen_color, []).append(card_id)

    return None


def play_building(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    card_id: str,
    color: str,
) -> None:
    player = state.players[player_id]
    if card_id not in player.hand:
        raise ValueError("Building card not in hand.")
    cd = catalog.cards[card_id]

    if not cd.play or cd.play.effect != "building":
        raise ValueError("Card is not a building action.")

    # disallowed groups
    disallowed = set(cd.play.params.get("disallowed_groups", []))
    if color in disallowed:
        raise ValueError("Cannot place building on this color.")

    # must have full set
    needed = len(catalog.rent_table[color])
    if len(player.properties.get(color, [])) < needed:
        raise ValueError("Need full set to place building.")

    # hotel requires house
    if cd.play.params.get("requires_house"):
        if "action_house" not in player.buildings.get(color, []):
            raise ValueError("Hotel requires a house on this set.")

    # move card from hand → buildings
    player.hand.remove(card_id)
    player.buildings.setdefault(color, []).append(card_id)


## Change Wild Color
def change_wild_color(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    card_id: str,
    new_color: str,
) -> GameState:
    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")

    player = state.players[player_id]

    # Find current color pile containing this card
    current_color = None
    for color, cards in player.properties.items():
        if card_id in cards:
            current_color = color
            break
    if current_color is None:
        raise ValueError("Card not found in player properties.")

    if card_id not in catalog.cards:
        raise ValueError(f"Unknown card id: {card_id}")
    cd = catalog.cards[card_id]

    if cd.kind != "property_wild":
        raise ValueError("Card is not a wild property.")
    if not cd.colors:
        raise ValueError("Card has no color options.")

    # Validate color choice
    if "any" in cd.colors:
        if new_color not in catalog.rent_table:
            raise ValueError(f"Invalid color '{new_color}'.")
    else:
        if new_color not in cd.colors:
            raise ValueError(f"Card cannot be set to color '{new_color}'.")

    # Move card to the new color pile
    player.properties[current_color].remove(card_id)
    player.properties.setdefault(new_color, []).append(card_id)

    return state


def is_counterable(card: CardDef) -> bool:
    if card.kind == "rent":
        return True
    if card.kind == "action" and card.play:
        return card.play.effect in {
            "charge_players",  # plural
            "charge_player",  # singular
            "steal_full_set",
            "steal_property",
            "swap_property",
        }
    return False


def create_pending_action(
    state: GameState,
    *,
    source_player: str,
    target_player: str,
    card_id: str,
    card_kind: str,
    effect: Optional[str],
    payload: Dict[str, Any],
) -> str:
    pending_id = f"pend_{uuid.uuid4().hex}"
    state.pending_actions[pending_id] = {
        "id": pending_id,
        "source_player": source_player,
        "target_player": target_player,
        "awaiting_player": target_player,
        "card_id": card_id,
        "card_kind": card_kind,
        "effect": effect,
        "payload": payload,
        "jsn_count": 0,
    }
    return pending_id


## Start Action
def start_action(
    state: GameState,
    catalog: CardCatalog,
    player_id: str,
    *,
    action_type: str,
    card_id: Optional[str] = None,
    bank_card_id: Optional[str] = None,
    property_card_id: Optional[str] = None,
    property_color: Optional[str] = None,
    rent_color: Optional[str] = None,
    double_rent_ids: Optional[List[str]] = None,
    target_player_id: Optional[str] = None,
    steal_card_id: Optional[str] = None,
    give_card_id: Optional[str] = None,
    steal_color: Optional[str] = None,
    change_wild: Optional[Dict[str, str]] = None,
    discard_ids: Optional[List[str]] = None,
) -> ActionResponse:
    try:
        if player_id not in state.players:
            raise ValueError("Unknown player_id.")
        actor = state.players[player_id]
        if state.current_player_id is not None and player_id != state.current_player_id:
            raise ValueError(
                f"Not your turn. Current player is {state.current_player_id}."
            )

        # === Play bank card ===
        if action_type == "play_bank":
            if not bank_card_id:
                raise ValueError("bank_card_id required.")
            if bank_card_id not in actor.hand:
                raise ValueError("Bank card not in hand.")
            ensure_action_available(state)
            play_bank(state, player_id, bank_card_id, catalog)
            record_turn_action(
                state,
                player_id=player_id,
                action_type=action_type,
                card_ids=[bank_card_id],
            )
            consume_action(state)
            return {"status": "ok", "response_type": "action_resolved", "state": state}

        # === Play property ===
        if action_type == "play_property":
            if not property_card_id:
                raise ValueError("property_card_id required.")
            if property_card_id not in actor.hand:
                raise ValueError("Property card not in hand.")
            ensure_action_available(state)
            play_property(state, catalog, player_id, property_card_id, property_color)
            record_turn_action(
                state,
                player_id=player_id,
                action_type=action_type,
                card_ids=[property_card_id],
            )
            consume_action(state)
            return {"status": "ok", "response_type": "action_resolved", "state": state}

        # === Change wild ===
        if action_type == "change_wild":
            if not change_wild:
                raise ValueError("change_wild required.")
            # validate before consuming action
            if change_wild["card_id"] not in actor.hand and all(
                change_wild["card_id"] not in cards
                for cards in actor.properties.values()
            ):
                raise ValueError("Wild card not in properties.")
            ensure_action_available(state)
            change_wild_color(
                state,
                catalog,
                player_id,
                change_wild["card_id"],
                change_wild["new_color"],
            )
            record_turn_action(
                state,
                player_id=player_id,
                action_type=action_type,
                card_ids=[change_wild["card_id"]],
            )
            consume_action(state)
            return {"status": "ok", "response_type": "action_resolved", "state": state}

        # === Discard / End turn ===
        if action_type == "discard":
            discard_cards(state, player_id, discard_ids)
            return {"status": "ok", "response_type": "action_resolved", "state": state}

        if action_type == "end_turn":
            current_pid = state.current_player_id
            if current_pid is None or current_pid not in state.players:
                raise ValueError("Current player is not set.")
            current_player = state.players[current_pid]
            hand_size = len(current_player.hand)

            if hand_size > 7:
                return {
                    "status": "ok",
                    "response_type": "discard_required",
                    "state": state,
                    "discard_required": {
                        "player_id": current_pid,
                        "required_count": hand_size - 7,
                    },
                    "message": f"You have {hand_size} cards. Discard {hand_size - 7} cards.",
                }

            return {
                "status": "ok",
                "response_type": "action_resolved",
                "state": end_turn(state, list(state.players.keys())),
            }

        # === Play action card ===
        if action_type in {"play_action_counterable", "play_action_non_counterable"}:
            if not card_id:
                raise ValueError("card_id required.")
            if card_id not in actor.hand:
                raise ValueError("Card not in hand.")
            card = catalog.cards[card_id]

            if action_type == "play_action_counterable":
                if not is_counterable(card):
                    raise ValueError("Card is not counterable.")
                ensure_action_available(state)

                target_mode = card.play.params.get("target") if card.play else None
                if target_mode == "all_others":
                    target_ids = [
                        pid for pid in state.players.keys() if pid != player_id
                    ]
                    if not target_ids:
                        raise ValueError("No opponents to target.")
                else:
                    if not target_player_id:
                        raise ValueError("target_player_id required.")
                    if target_player_id == player_id:
                        raise ValueError("Cannot target yourself.")
                    if target_player_id not in state.players:
                        raise ValueError(
                            f"Unknown target_player_id: {target_player_id}"
                        )
                    target_ids = [target_player_id]

                effect = card.play.effect if card.play else None

                # Validate counterable action payload before discarding the card(s).
                if effect == "steal_property":
                    if len(target_ids) != 1:
                        raise ValueError("Sly Deal must target exactly one player.")
                    if not steal_card_id:
                        raise ValueError("steal_card_id required for Sly Deal.")
                    target = state.players[target_ids[0]]
                    steal_color_actual = find_card_color(
                        target.properties, steal_card_id
                    )
                    if not card.play.params.get(
                        "from_full_set_allowed", False
                    ) and is_full_set(target, catalog, steal_color_actual):
                        raise ValueError("Cannot steal from a full set.")

                if effect == "swap_property":
                    if len(target_ids) != 1:
                        raise ValueError("Forced Deal must target exactly one player.")
                    if not steal_card_id or not give_card_id:
                        raise ValueError(
                            "steal_card_id and give_card_id required for Forced Deal."
                        )
                    target = state.players[target_ids[0]]
                    steal_color_actual = find_card_color(
                        target.properties, steal_card_id
                    )
                    give_color_actual = find_card_color(actor.properties, give_card_id)
                    if not card.play.params.get("from_full_set_allowed", False):
                        if is_full_set(target, catalog, steal_color_actual):
                            raise ValueError("Cannot take from a full set.")
                        if is_full_set(actor, catalog, give_color_actual):
                            raise ValueError("Cannot give from your full set.")

                if effect == "steal_full_set":
                    if len(target_ids) != 1:
                        raise ValueError("Deal Breaker must target exactly one player.")
                    if not steal_color:
                        raise ValueError("steal_color required for Deal Breaker.")
                    target = state.players[target_ids[0]]
                    if not is_full_set(target, catalog, steal_color):
                        raise ValueError(
                            f"Target does not have a full set of '{steal_color}'."
                        )

                discard_action_cards(state, actor, [card_id] + (double_rent_ids or []))
                record_turn_action(
                    state,
                    player_id=player_id,
                    action_type=action_type,
                    card_ids=[card_id] + (double_rent_ids or []),
                )

                pending_requests = []
                for tid in target_ids:
                    pending_id = create_pending_action(
                        state,
                        source_player=player_id,
                        target_player=tid,
                        card_id=card_id,
                        card_kind=card.kind,
                        effect=card.play.effect if card.play else None,
                        payload={
                            "rent_color": rent_color,
                            "double_rent_ids": double_rent_ids,
                            "steal_card_id": steal_card_id,
                            "give_card_id": give_card_id,
                            "steal_color": steal_color,
                            "amount": (
                                card.play.params.get("amount") if card.play else None
                            ),
                        },
                    )
                    pending_requests.append(
                        {
                            "pending_id": pending_id,
                            "target_player": tid,
                            "prompt": "Accept or Just Say No?",
                        }
                    )
                consume_action(state)

                return {
                    "status": "ok",
                    "response_type": "response_required",
                    "state": state,
                    "response_required": {"pending_requests": pending_requests},
                }

            # non‑counterable branch
            if is_counterable(card):
                raise ValueError("Card is counterable; use play_action_counterable.")

            ensure_action_available(state)

            result = apply_action_effects(
                state,
                catalog,
                player_id=player_id,
                card_id=card_id,
                rent_color=rent_color,
                double_rent_ids=double_rent_ids,
                target_player_id=target_player_id,
                steal_card_id=steal_card_id,
                give_card_id=give_card_id,
                steal_color=steal_color,
                already_discarded=False,
            )
            record_turn_action(
                state,
                player_id=player_id,
                action_type=action_type,
                card_ids=[card_id] + (double_rent_ids or []),
            )
            consume_action(state)
            return result

        raise ValueError("Unknown action_type.")

    except Exception as e:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": str(e),
        }

    ## Respond to pending


def respond_to_pending(
    state: GameState,
    catalog: CardCatalog,
    pending_id: str,
    player_id: str,
    response: str,
) -> ActionResponse:
    if pending_id not in state.pending_actions:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": "Pending not found.",
        }

    pending = state.pending_actions[pending_id]

    if player_id != pending["awaiting_player"]:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": "Not your response turn.",
        }

    if response == "accept":
        if pending["jsn_count"] % 2 == 1:
            del state.pending_actions[pending_id]
            return {
                "status": "ok",
                "response_type": "action_resolved",
                "state": state,
                "log": {"action": "canceled_by_jsn", "pending_id": pending_id},
            }

        try:
            result = apply_action_effects(
                state,
                catalog,
                player_id=pending["source_player"],
                card_id=pending["card_id"],
                rent_color=pending["payload"].get("rent_color"),
                double_rent_ids=pending["payload"].get("double_rent_ids"),
                target_player_id=pending["target_player"],
                steal_card_id=pending["payload"].get("steal_card_id"),
                give_card_id=pending["payload"].get("give_card_id"),
                steal_color=pending["payload"].get("steal_color"),
                already_discarded=True,
            )
        except ValueError as e:
            # Do not deadlock the game on an invalid/cannot-apply pending action.
            del state.pending_actions[pending_id]
            return {
                "status": "error",
                "response_type": "action_resolved",
                "state": state,
                "message": str(e),
                "log": {
                    "action": "pending_accept_failed",
                    "pending_id": pending_id,
                },
            }
        del state.pending_actions[pending_id]
        return result

    if response == "just_say_no":
        jsn_card_id = catalog.jsn_card_id
        if jsn_card_id not in state.players[player_id].hand:
            return {
                "status": "error",
                "response_type": "action_resolved",
                "message": "No JSN in hand.",
            }

        state.players[player_id].hand.remove(jsn_card_id)
        state.deck.discard_pile.append(jsn_card_id)
        record_turn_action(
            state,
            player_id=player_id,
            action_type="just_say_no",
            card_ids=[jsn_card_id],
        )

        pending["jsn_count"] += 1
        pending["awaiting_player"] = (
            pending["source_player"]
            if player_id == pending["target_player"]
            else pending["target_player"]
        )

        return {
            "status": "ok",
            "response_type": "response_required",
            "state": state,
            "response_required": {
                "pending_requests": [
                    {
                        "pending_id": pending_id,
                        "target_player": pending["awaiting_player"],
                        "prompt": "Opponent played Just Say No. Counter?",
                    }
                ]
            },
        }

    return {
        "status": "error",
        "response_type": "action_resolved",
        "message": "Unknown response.",
    }


## Apply Action Effects


def apply_action_effects(
    state: GameState,
    catalog: CardCatalog,
    *,
    player_id: str,
    card_id: str,
    rent_color: Optional[str] = None,
    double_rent_ids: Optional[List[str]] = None,
    target_player_id: Optional[str] = None,
    steal_card_id: Optional[str] = None,
    give_card_id: Optional[str] = None,
    steal_color: Optional[str] = None,
    already_discarded: bool = False,
) -> ActionResponse:

    # Define Actor, Card, and Effect for later logic
    actor = state.players[player_id]
    card = catalog.cards[card_id]
    effect = card.play.effect if card.play else None

    # discard action card here only if not already discarded
    if not already_discarded and effect != "building":
        discard_action_cards(state, actor, [card_id] + (double_rent_ids or []))

    # Rent
    if card.kind == "rent":
        if not target_player_id:
            raise ValueError("target_player_id required for rent.")
        amount = charge_rent_amount(
            state=state,
            catalog=catalog,
            player_id=player_id,
            rent_card_id=card_id,
            color=rent_color,
            double_rent_ids=double_rent_ids,
            require_in_hand=not already_discarded,
        )
        return {
            "status": "ok",
            "response_type": "payment_required",
            "state": state,
            "payment_request": {
                "request_id": f"pay_{uuid.uuid4().hex}",
                "receiver_id": player_id,
                "targets": [{"player_id": target_player_id, "amount": amount}],
            },
            "log": {"action": "rent", "player_id": player_id, "amount": amount},
        }

    # Action cards
    if card.kind == "action":

        if effect == "draw_cards":
            amount = int(card.play.params.get("amount", 0))
            draw_cards(state, player_id, amount)
            return {
                "status": "ok",
                "response_type": "action_resolved",
                "state": state,
                "log": {
                    "action": "draw_cards",
                    "player_id": player_id,
                    "amount": amount,
                },
            }

        if effect in {"steal_full_set", "steal_property", "swap_property"}:
            result = process_property_manipulation(
                state=state,
                catalog=catalog,
                actor_id=player_id,
                action_card_id=card_id,
                target_player_id=target_player_id,
                steal_card_id=steal_card_id,
                give_card_id=give_card_id,
                steal_color=steal_color,
            )
            return {
                "status": "ok",
                "response_type": "action_resolved",
                "state": state,
                "log": result,
            }

        if effect in {"charge_players", "charge_player"}:
            if not target_player_id:
                raise ValueError("target_player_id required for this action.")
            amount = int(card.play.params.get("amount", 0))
            return {
                "status": "ok",
                "response_type": "payment_required",
                "state": state,
                "payment_request": {
                    "request_id": f"pay_{uuid.uuid4().hex}",
                    "receiver_id": player_id,
                    "targets": [{"player_id": target_player_id, "amount": amount}],
                },
                "log": {
                    "action": "charge_players",
                    "player_id": player_id,
                    "amount": amount,
                },
            }

        if effect == "building":
            play_building(
                state, catalog, player_id, card_id, rent_color
            )  # use rent_color as chosen set color
            return {
                "status": "ok",
                "response_type": "action_resolved",
                "state": state,
                "log": {
                    "action": "building",
                    "player_id": player_id,
                    "card_id": card_id,
                    "color": rent_color,
                },
            }

    raise ValueError("Unsupported action effect.")
