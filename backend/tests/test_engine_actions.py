# backend/tests/test_engine_actions.py
import pytest

from backend.app.engine.rules import start_action, respond_to_pending


def get_action_id(catalog, effect_name):
    return next(
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "action" and cd.play and cd.play.effect == effect_name
    )


def get_properties_for_color(catalog, color):
    return [
        cid
        for cid, cd in catalog.cards.items()
        if cd.kind == "property" and cd.meta.get("property_group") == color
    ]


def pick_color_with_properties(catalog, min_count=1):
    for color, steps in catalog.rent_table.items():
        props = get_properties_for_color(catalog, color)
        if len(props) >= min_count:
            return color, steps, props
    raise ValueError("No color with enough properties found.")


def pick_color_with_full_set(catalog):
    for color, steps in catalog.rent_table.items():
        props = get_properties_for_color(catalog, color)
        if len(props) >= len(steps):
            return color, steps, props
    raise ValueError("No color with a full set found.")


def test_counterable_rent_jsn_flow(state, catalog):
    rent_id = next(cid for cid, cd in catalog.cards.items() if cd.kind == "rent")
    jsn_id = catalog.jsn_card_id

    # setup
    state.players["p1"].hand = [rent_id, jsn_id]
    state.players["p2"].hand = [jsn_id]
    state.players["p1"].properties["green"] = [
        "prop_green_north_carolina_avenue",
        "prop_green_pacific_avenue",
    ]

    res1 = start_action(
        state,
        catalog,
        player_id="p1",
        action_type="play_action_counterable",
        card_id=rent_id,
        rent_color="green",
        target_player_id="p2",
    )
    assert res1["response_type"] == "response_required"
    pending_id = res1["response_required"]["pending_requests"][0]["pending_id"]

    res2 = respond_to_pending(state, catalog, pending_id, "p2", "just_say_no")
    assert res2["response_type"] == "response_required"

    res3 = respond_to_pending(state, catalog, pending_id, "p1", "just_say_no")
    assert res3["response_type"] == "response_required"

    res4 = respond_to_pending(state, catalog, pending_id, "p2", "accept")
    assert res4["response_type"] == "payment_required"


def test_steal_property_action(state, catalog):
    sly_id = get_action_id(catalog, "steal_property")
    color, steps, props = pick_color_with_properties(catalog, min_count=2)

    # actor has action card
    state.players["p1"].hand = [sly_id]
    # target has a single property (not a full set)
    state.players["p2"].properties[color] = [props[0]]

    res1 = start_action(
        state,
        catalog,
        player_id="p1",
        action_type="play_action_counterable",
        card_id=sly_id,
        target_player_id="p2",
        steal_card_id=props[0],
    )
    pending_id = res1["response_required"]["pending_requests"][0]["pending_id"]
    res2 = respond_to_pending(state, catalog, pending_id, "p2", "accept")
    assert res2["response_type"] == "action_resolved"
    assert props[0] in state.players["p1"].properties.get(color, [])
    assert props[0] not in state.players["p2"].properties.get(color, [])


def test_swap_property_action(state, catalog):
    swap_id = get_action_id(catalog, "swap_property")
    color_a, steps_a, props_a = pick_color_with_properties(catalog, min_count=2)
    color_b, steps_b, props_b = pick_color_with_properties(catalog, min_count=2)

    # actor has action + one property, target has one property
    state.players["p1"].hand = [swap_id]
    state.players["p1"].properties[color_a] = [props_a[0]]
    state.players["p2"].properties[color_b] = [props_b[0]]

    res1 = start_action(
        state,
        catalog,
        player_id="p1",
        action_type="play_action_counterable",
        card_id=swap_id,
        target_player_id="p2",
        steal_card_id=props_b[0],
        give_card_id=props_a[0],
    )
    pending_id = res1["response_required"]["pending_requests"][0]["pending_id"]
    res2 = respond_to_pending(state, catalog, pending_id, "p2", "accept")
    assert res2["response_type"] == "action_resolved"
    assert props_b[0] in state.players["p1"].properties.get(color_b, [])
    assert props_a[0] in state.players["p2"].properties.get(color_a, [])


def test_deal_breaker_no_jsn(state, catalog):
    deal_id = get_action_id(catalog, "steal_full_set")
    color, steps, props = pick_color_with_full_set(catalog)
    full_set_size = len(steps)

    state.players["p1"].hand = [deal_id]
    state.players["p2"].properties[color] = props[:full_set_size]

    res1 = start_action(
        state,
        catalog,
        player_id="p1",
        action_type="play_action_counterable",
        card_id=deal_id,
        target_player_id="p2",
        steal_color=color,
    )
    pending_id = res1["response_required"]["pending_requests"][0]["pending_id"]
    res2 = respond_to_pending(state, catalog, pending_id, "p2", "accept")
    assert res2["response_type"] == "action_resolved"
    assert len(state.players["p2"].properties.get(color, [])) == 0
    assert len(state.players["p1"].properties.get(color, [])) == full_set_size


def test_deal_breaker_with_jsn(state, catalog):
    deal_id = get_action_id(catalog, "steal_full_set")
    jsn_id = catalog.jsn_card_id
    color, steps, props = pick_color_with_full_set(catalog)
    full_set_size = len(steps)

    state.players["p1"].hand = [deal_id, jsn_id]
    state.players["p2"].hand = [jsn_id]
    state.players["p2"].properties[color] = props[:full_set_size]

    res1 = start_action(
        state,
        catalog,
        player_id="p1",
        action_type="play_action_counterable",
        card_id=deal_id,
        target_player_id="p2",
        steal_color=color,
    )
    pending_id = res1["response_required"]["pending_requests"][0]["pending_id"]

    res2 = respond_to_pending(state, catalog, pending_id, "p2", "just_say_no")
    assert res2["response_type"] == "response_required"

    res3 = respond_to_pending(state, catalog, pending_id, "p1", "just_say_no")
    assert res3["response_type"] == "response_required"

    res4 = respond_to_pending(state, catalog, pending_id, "p2", "accept")
    assert res4["response_type"] == "action_resolved"
