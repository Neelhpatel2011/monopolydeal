import pytest

from backend.app.engine.effects.rent import charge_rent_amount


def get_rent_setup(catalog):
    for color, steps in catalog.rent_table.items():
        rent_card_id = next(
            (
                cid
                for cid, cd in catalog.cards.items()
                if cd.kind == "rent"
                and cd.colors
                and (color in cd.colors or "any" in cd.colors)
            ),
            None,
        )
        prop_ids = [
            cid
            for cid, cd in catalog.cards.items()
            if cd.kind == "property" and cd.meta.get("property_group") == color
        ]
        if rent_card_id and prop_ids:
            return color, steps, rent_card_id, prop_ids
    raise ValueError("No suitable rent setup found in catalog.")


def get_double_rent_id(catalog):
    return next(
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "action"
        and cd.play
        and cd.play.effect == "modifier"
        and cd.play.params.get("applies_to") == "rent"
    )


def get_building_id(catalog):
    return next(
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "action" and cd.play and cd.play.effect == "building"
    )


def test_charge_rent_base(state, catalog):
    player_id = "p1"
    color, steps, rent_card_id, prop_ids = get_rent_setup(catalog)

    # choose 2 properties if possible, else 1
    count = 2 if len(prop_ids) >= 2 else 1
    state.players[player_id].properties[color] = prop_ids[:count]
    state.players[player_id].hand = [rent_card_id]

    expected = steps[min(count, len(steps)) - 1]
    amount = charge_rent_amount(
        state=state,
        catalog=catalog,
        player_id=player_id,
        rent_card_id=rent_card_id,
        color=color,
        double_rent_ids=[],
    )
    assert amount == expected


def test_charge_rent_double(state, catalog):
    player_id = "p1"
    color, steps, rent_card_id, prop_ids = get_rent_setup(catalog)
    double_rent_id = get_double_rent_id(catalog)

    state.players[player_id].properties[color] = prop_ids[:1]
    state.players[player_id].hand = [rent_card_id, double_rent_id]

    base = steps[0]
    amount = charge_rent_amount(
        state=state,
        catalog=catalog,
        player_id=player_id,
        rent_card_id=rent_card_id,
        color=color,
        double_rent_ids=[double_rent_id],
    )
    assert amount == base * 2


def test_charge_rent_building_bonus_full_set(state, catalog):
    player_id = "p1"
    color, steps, rent_card_id, prop_ids = get_rent_setup(catalog)
    building_id = get_building_id(catalog)

    # full set for the color
    needed = len(steps)
    if len(prop_ids) < needed:
        pytest.skip("Not enough properties to form a full set.")

    state.players[player_id].properties[color] = prop_ids[:needed]
    state.players[player_id].buildings[color] = [building_id]
    state.players[player_id].hand = [rent_card_id]

    base = steps[-1]
    bonus = int(catalog.cards[building_id].play.params.get("rent_bonus", 0))

    amount = charge_rent_amount(
        state=state,
        catalog=catalog,
        player_id=player_id,
        rent_card_id=rent_card_id,
        color=color,
        double_rent_ids=[],
    )
    assert amount == base + bonus
