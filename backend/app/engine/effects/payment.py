# your payment logic lives here

# Placeholder for payment logic
from collections import Counter
from typing import Dict, List, Any

from ..state import GameState
from ...services.card_catalog import CardCatalog


def remove_ids_from_list(pool: List[str], ids_to_remove: List[str]) -> None:
    counts = Counter(pool)
    remove_counts = Counter(ids_to_remove)
    for cid, cnt in remove_counts.items():
        if cnt > counts.get(cid, 0):
            raise ValueError(f"Cannot remove {cnt} copies of {cid} from list.")
    for cid in ids_to_remove:
        pool.remove(cid)


def remove_ids_from_properties(
    properties: Dict[str, List[str]], ids_to_remove: List[str]
) -> Dict[str, List[str]]:
    to_remove = Counter(ids_to_remove)
    removed_by_color: Dict[str, List[str]] = {}

    for color, cards in properties.items():
        new_cards = []
        for cid in cards:
            if to_remove[cid] > 0:
                to_remove[cid] -= 1
                removed_by_color.setdefault(color, []).append(cid)
            else:
                new_cards.append(cid)
        properties[color] = new_cards

    missing = [cid for cid, cnt in to_remove.items() if cnt > 0]
    if missing:
        raise ValueError(f"Card ids not found in properties: {missing}")

    return removed_by_color


def remove_ids_from_buildings(
    buildings: Dict[str, List[str]], ids_to_remove: List[str]
) -> Dict[str, List[str]]:
    to_remove = Counter(ids_to_remove)
    removed_by_color: Dict[str, List[str]] = {}

    for color, cards in buildings.items():
        new_cards = []
        for cid in cards:
            if to_remove[cid] > 0:
                to_remove[cid] -= 1
                removed_by_color.setdefault(color, []).append(cid)
            else:
                new_cards.append(cid)
        buildings[color] = new_cards

    missing = [cid for cid, cnt in to_remove.items() if cnt > 0]
    if missing:
        raise ValueError(f"Building ids not found: {missing}")

    return removed_by_color


def card_value(cid: str, catalog: CardCatalog) -> int:
    if cid not in catalog.cards:
        raise ValueError(f"Unknown card id: {cid}")
    return catalog.cards[cid].money_value


def process_payment(
    state: GameState,
    payer_id: str,
    receiver_id: str,
    catalog: CardCatalog,
    user_bank_payment_ids: List[str],
    user_property_payment_ids: List[str],
    user_building_payment_ids: List[str],
    money_charged: int,
) -> Dict[str, Any]:

    # TODO: Implement Payment of Hotel FIRST and then houses! But honestly we can do that later.
    try:
        if payer_id not in state.players:
            raise ValueError(f"Unknown payer_id: {payer_id}")
        if receiver_id not in state.players:
            raise ValueError(f"Unknown receiver_id: {receiver_id}")

        payer = state.players[payer_id]
        receiver = state.players[receiver_id]

        bank_counts = Counter(payer.bank)
        prop_counts = Counter(
            [cid for cards in payer.properties.values() for cid in cards]
        )
        bld_counts = Counter(
            [cid for cards in payer.buildings.values() for cid in cards]
        )

        bank_pay_counts = Counter(user_bank_payment_ids)
        prop_pay_counts = Counter(user_property_payment_ids)
        bld_pay_counts = Counter(user_building_payment_ids)

        for cid, cnt in bank_pay_counts.items():
            if cnt > bank_counts.get(cid, 0):
                raise ValueError(
                    f"Payment includes {cid} not in bank or exceeds count."
                )

        for cid, cnt in prop_pay_counts.items():
            if cnt > prop_counts.get(cid, 0):
                raise ValueError(
                    f"Payment includes {cid} not in properties or exceeds count."
                )

        for cid, cnt in bld_pay_counts.items():
            if cnt > bld_counts.get(cid, 0):
                raise ValueError(
                    f"Payment includes {cid} not in buildings or exceeds count."
                )

        offered_total = (
            sum(card_value(cid, catalog) for cid in user_bank_payment_ids)
            + sum(card_value(cid, catalog) for cid in user_property_payment_ids)
            + sum(card_value(cid, catalog) for cid in user_building_payment_ids)
        )

        available_total = (
            sum(card_value(cid, catalog) for cid in payer.bank)
            + sum(card_value(cid, catalog) for cid in prop_counts.elements())
            + sum(card_value(cid, catalog) for cid in bld_counts.elements())
        )

        paid_all_bank = bank_pay_counts == bank_counts
        paid_all_props = prop_pay_counts == prop_counts
        paid_all_blds = bld_pay_counts == bld_counts

        if offered_total >= money_charged:
            remove_ids_from_list(payer.bank, user_bank_payment_ids)
            removed_props = remove_ids_from_properties(
                payer.properties, user_property_payment_ids
            )
            removed_blds = remove_ids_from_buildings(
                payer.buildings, user_building_payment_ids
            )
            fully_paid = True
        elif (
            (available_total < money_charged)
            and (offered_total == available_total)
            and paid_all_bank
            and paid_all_props
            and paid_all_blds
        ):
            remove_ids_from_list(payer.bank, user_bank_payment_ids)
            removed_props = remove_ids_from_properties(
                payer.properties, user_property_payment_ids
            )
            removed_blds = remove_ids_from_buildings(
                payer.buildings, user_building_payment_ids
            )
            fully_paid = False
        else:
            raise ValueError("Insufficient payment.")

        receiver.bank.extend(user_bank_payment_ids)
        for color, cards in removed_props.items():
            receiver.properties.setdefault(color, []).extend(cards)
        for color, cards in removed_blds.items():
            receiver.buildings.setdefault(color, []).extend(cards)

        return {
            "status": "ok",
            "response_type": "payment_applied",
            "state": state,
            "log": {
                "payer_id": payer_id,
                "receiver_id": receiver_id,
                "paid_amount": offered_total,
                "bank_cards": user_bank_payment_ids,
                "property_cards": user_property_payment_ids,
                "building_cards": user_building_payment_ids,
                "fully_paid": fully_paid,
            },
        }

    except Exception as e:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": str(e),
        }
