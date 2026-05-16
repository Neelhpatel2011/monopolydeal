from pathlib import Path

from backend.app.engine.rules import respond_to_pending, start_action
from backend.app.engine.state import DeckState, GameState, PlayerState
from backend.app.services.card_catalog import load_catalog
from backend.app.services.player_view import build_player_view


CATALOG = load_catalog(str(Path(__file__).resolve().parents[1] / "cards" / "base"))


def _three_player_rent_state(*, rent_card_id: str) -> GameState:
    return GameState(
        id="rent-game",
        players={
            "Host": PlayerState(
                id="Host",
                hand=[rent_card_id],
                properties={
                    "red": ["prop_red_illinois_avenue", "prop_red_indiana_avenue"],
                    "yellow": ["prop_yellow_atlantic_avenue"],
                    "dark_blue": ["prop_dark_blue_boardwalk"],
                },
            ),
            "Alex": PlayerState(id="Alex", bank=["money_2m"]),
            "Sam": PlayerState(id="Sam", bank=["money_2m"]),
        },
        deck=DeckState(draw_pile=[], discard_pile=[]),
        current_player_id="Host",
    )


def test_regular_rent_view_charges_all_opponents_without_target_choice():
    state = _three_player_rent_state(rent_card_id="rent_red_yellow")

    view = build_player_view(state, "Host", CATALOG)
    action = view.you.available_actions["rent_red_yellow"]

    assert action.required_fields == ["rent_color"]
    assert [field.field for field in action.fields] == ["rent_color"]
    assert {option.value for option in action.fields[0].options} == {"red", "yellow"}


def test_regular_rent_starts_counter_prompt_for_each_opponent_and_accept_creates_payment():
    state = _three_player_rent_state(rent_card_id="rent_red_yellow")

    response = start_action(
        state,
        CATALOG,
        "Host",
        action_type="play_action_counterable",
        card_id="rent_red_yellow",
        rent_color="red",
    )

    assert response["status"] == "ok"
    assert response["response_type"] == "response_required"
    pending_requests = response["response_required"]["pending_requests"]
    assert {request["target_player"] for request in pending_requests} == {"Alex", "Sam"}
    assert "rent_red_yellow" not in state.players["Host"].hand
    assert "rent_red_yellow" in state.deck.discard_pile
    assert len(state.payment_trackers) == 1
    assert {participant.status for participant in state.payment_trackers[0].participants} == {"awaiting_response"}

    alex_pending_id = next(
        request["pending_id"]
        for request in pending_requests
        if request["target_player"] == "Alex"
    )
    payment_response = respond_to_pending(
        state,
        CATALOG,
        pending_id=alex_pending_id,
        player_id="Alex",
        response="accept",
    )

    assert payment_response["status"] == "ok"
    assert payment_response["response_type"] == "payment_required"
    assert payment_response["payment_request"]["receiver_id"] == "Host"
    assert payment_response["payment_request"]["targets"] == [
        {"player_id": "Alex", "amount": 3}
    ]
    assert payment_response["payment_request"]["group_id"] == state.payment_trackers[0].group_id
    alex_tracker = next(
        participant
        for participant in state.payment_trackers[0].participants
        if participant.player_id == "Alex"
    )
    assert alex_tracker.status == "awaiting_response"


def test_multicolor_rent_still_requires_one_target_and_accept_creates_payment():
    state = _three_player_rent_state(rent_card_id="multicolor_rent")

    view = build_player_view(state, "Host", CATALOG)
    action = view.you.available_actions["multicolor_rent"]
    assert action.required_fields == ["target_player_id", "rent_color"]
    assert [field.field for field in action.fields] == ["target_player_id", "rent_color"]

    response = start_action(
        state,
        CATALOG,
        "Host",
        action_type="play_action_counterable",
        card_id="multicolor_rent",
        target_player_id="Sam",
        rent_color="dark_blue",
    )

    assert response["status"] == "ok"
    pending_requests = response["response_required"]["pending_requests"]
    assert [request["target_player"] for request in pending_requests] == ["Sam"]

    payment_response = respond_to_pending(
        state,
        CATALOG,
        pending_id=pending_requests[0]["pending_id"],
        player_id="Sam",
        response="accept",
    )

    assert payment_response["status"] == "ok"
    assert payment_response["response_type"] == "payment_required"
    assert payment_response["payment_request"]["targets"] == [
        {"player_id": "Sam", "amount": 3}
    ]


def test_player_view_exposes_persistent_game_log_for_played_cards():
    state = _three_player_rent_state(rent_card_id="rent_red_yellow")

    start_action(
        state,
        CATALOG,
        "Host",
        action_type="play_action_counterable",
        card_id="rent_red_yellow",
        rent_color="red",
    )
    view = build_player_view(state, "Alex", CATALOG)

    assert state.turn_actions[-1].card_ids == ["rent_red_yellow"]
    assert view.game_log[-1].player_id == "Host"
    assert view.game_log[-1].action_type == "play_action_counterable"
    assert view.game_log[-1].card_ids == ["rent_red_yellow"]
    assert view.game_log[-1].turn_number == state.turn_number
