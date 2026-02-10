import pytest

from backend.app.engine.effects.payment import process_payment


def get_card_id(catalog, predicate):
    return next(cid for cid, cd in catalog.cards.items() if predicate(cd))


def test_process_payment_bank_property_building(state, catalog):
    payer_id = "p2"
    receiver_id = "p1"

    # pick one money card
    money_id = get_card_id(
        catalog, lambda cd: cd.kind == "money" and cd.money_value > 0
    )

    # pick one property card with a group
    prop_id = get_card_id(
        catalog, lambda cd: cd.kind == "property" and cd.meta.get("property_group")
    )
    prop_color = catalog.cards[prop_id].meta.get("property_group")

    # pick one building card (house/hotel)
    building_id = get_card_id(
        catalog,
        lambda cd: cd.kind == "action" and cd.play and cd.play.effect == "building",
    )

    # set up payer assets
    state.players[payer_id].bank = [money_id]
    state.players[payer_id].properties[prop_color] = [prop_id]
    state.players[payer_id].buildings[prop_color] = [building_id]

    # total value offered
    offered_total = (
        catalog.cards[money_id].money_value
        + catalog.cards[prop_id].money_value
        + catalog.cards[building_id].money_value
    )

    res = process_payment(
        state=state,
        payer_id=payer_id,
        receiver_id=receiver_id,
        catalog=catalog,
        user_bank_payment_ids=[money_id],
        user_property_payment_ids=[prop_id],
        user_building_payment_ids=[building_id],
        money_charged=offered_total,
    )

    assert res["status"] == "ok"
    assert money_id in state.players[receiver_id].bank
    assert prop_id in state.players[receiver_id].properties.get(prop_color, [])
    assert building_id in state.players[receiver_id].buildings.get(prop_color, [])

    assert money_id not in state.players[payer_id].bank
    assert prop_id not in state.players[payer_id].properties.get(prop_color, [])
    assert building_id not in state.players[payer_id].buildings.get(prop_color, [])


def test_process_payment_insufficient(state, catalog):
    payer_id = "p2"
    receiver_id = "p1"

    money_ids = [
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "money" and cd.money_value > 0
    ][:2]
    assert len(money_ids) == 2
    state.players[payer_id].bank = money_ids[:]

    res = process_payment(
        state=state,
        payer_id=payer_id,
        receiver_id=receiver_id,
        catalog=catalog,
        user_bank_payment_ids=[money_ids[0]],  # offer less than available
        user_property_payment_ids=[],
        user_building_payment_ids=[],
        money_charged=catalog.cards[money_ids[0]].money_value
        + 1,  # still less than total available
    )

    assert res["status"] == "error"
    assert "Insufficient payment" in res["message"]


def test_process_payment_all_available_when_short(state, catalog):
    payer_id = "p2"
    receiver_id = "p1"

    # give payer two money cards
    money_ids = [
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "money" and cd.money_value > 0
    ][:2]
    assert len(money_ids) == 2

    state.players[payer_id].bank = money_ids[:]

    available_total = sum(catalog.cards[cid].money_value for cid in money_ids)

    # charge more than total, but payer gives ALL available cards
    res = process_payment(
        state=state,
        payer_id=payer_id,
        receiver_id=receiver_id,
        catalog=catalog,
        user_bank_payment_ids=money_ids,
        user_property_payment_ids=[],
        user_building_payment_ids=[],
        money_charged=available_total + 5,
    )

    assert res["status"] == "ok"
    assert res["log"]["fully_paid"] is False
    assert state.players[payer_id].bank == []
    for cid in money_ids:
        assert cid in state.players[receiver_id].bank
