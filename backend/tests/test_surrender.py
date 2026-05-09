from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.api import routes_games
from backend.app.engine.state import DeckState, GameState, PlayerState, TurnAction
from backend.app.main import app
from backend.app.services import game_service, session_auth


def _build_active_state() -> GameState:
    return GameState(
        id="550e8400-e29b-41d4-a716-446655440000",
        game_code="Q7K9P",
        host_id="Host",
        players={
            "Host": PlayerState(id="Host", hand=["money_1m"]),
            "Sam": PlayerState(
                id="Sam",
                hand=["rent_red_yellow"],
                bank=["money_5m"],
                properties={
                    "red": ["prop_red_2"],
                    "yellow": ["prop_yellow_1"],
                },
                buildings={"red": ["action_house"]},
            ),
            "Riley": PlayerState(id="Riley", hand=["money_2m"]),
        },
        deck=DeckState(
            draw_pile=["money_3m", "action_pass_go", "money_4m"],
            discard_pile=[],
        ),
        current_player_id="Sam",
        turn_number=3,
        actions_taken=2,
        turn_actions=[
            TurnAction(player_id="Sam", action_type="play_property", card_ids=["prop_red_1"])
        ],
        pending_actions={
            "pend_1": {
                "id": "pend_1",
                "source_player": "Sam",
                "target_player": "Host",
                "awaiting_player": "Host",
                "card_id": "rent_red_yellow",
            }
        },
    )


def _session_row(*, game_id: str, player_id: str):
    expires_at = datetime.now(timezone.utc) + timedelta(days=1)
    return {
        "token_hash": session_auth.hash_player_session_token("raw-session-token"),
        "game_id": game_id,
        "player_id": player_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "revoked_at": None,
    }


def test_surrender_game_advances_turn_when_current_player_quits(monkeypatch):
    state = _build_active_state()
    updated_states: list[GameState] = []
    revoked: list[tuple[str, str]] = []
    deleted_payment_games: list[str] = []
    shuffle_calls: list[list[str]] = []

    monkeypatch.setattr(game_service.repo, "get_game", lambda game_id: state)
    monkeypatch.setattr(
        game_service.repo,
        "revoke_player_sessions_for_player",
        lambda *, game_id, player_id: revoked.append((game_id, player_id)),
    )
    monkeypatch.setattr(
        game_service.repo,
        "delete_pending_payments_for_game",
        lambda game_id: deleted_payment_games.append(game_id),
    )
    monkeypatch.setattr(
        game_service.repo,
        "update_game",
        lambda next_state, status=None: updated_states.append(next_state.model_copy(deep=True)),
    )
    monkeypatch.setattr(
        game_service.random,
        "shuffle",
        lambda cards: shuffle_calls.append(list(cards)),
    )

    result = game_service.surrender_game(state.id, "Sam")

    assert result["deleted"] is False
    next_state = result["state"]
    assert next_state is not None
    assert "Sam" not in next_state.players
    assert next_state.current_player_id == "Riley"
    assert next_state.turn_number == 4
    assert next_state.actions_taken == 0
    assert next_state.turn_actions == []
    assert next_state.pending_actions == {}
    assert next_state.payment_trackers == []
    assert next_state.players["Riley"].hand[-2:] == ["money_3m", "action_pass_go"]
    assert shuffle_calls == [
        [
            "money_3m",
            "action_pass_go",
            "money_4m",
            "rent_red_yellow",
            "money_5m",
            "prop_red_2",
            "prop_yellow_1",
            "action_house",
        ]
    ]
    assert next_state.deck.draw_pile == [
        "money_4m",
        "rent_red_yellow",
        "money_5m",
        "prop_red_2",
        "prop_yellow_1",
        "action_house",
    ]
    assert revoked == [(state.id, "Sam")]
    assert deleted_payment_games == [state.id]
    assert updated_states[-1].current_player_id == "Riley"


def test_surrender_route_clears_cookie_and_broadcasts_remaining_players(monkeypatch):
    state = _build_active_state()
    del state.players["Sam"]
    state.current_player_id = "Riley"
    state.turn_number = 4

    disconnect_calls: list[tuple[str, str]] = []
    surrender_events: list[tuple[str, str, tuple[str, ...]]] = []
    view_broadcasts: list[tuple[str, list[str]]] = []

    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Sam"),
    )
    monkeypatch.setattr(
        routes_games,
        "surrender_game",
        lambda *, game_id, player_id: {"deleted": False, "state": state},
    )

    async def fake_disconnect(game_id: str, player_id: str) -> None:
        disconnect_calls.append((game_id, player_id))

    async def fake_broadcast_player_surrendered(
        game_id: str,
        *,
        event_id: str,
        player_id: str,
        recipient_ids: list[str],
    ) -> None:
        surrender_events.append((game_id, player_id, tuple(recipient_ids)))

    async def fake_broadcast_player_views(game_id: str, next_state: GameState) -> None:
        view_broadcasts.append((game_id, list(next_state.players.keys())))

    monkeypatch.setattr(routes_games.manager, "disconnect", fake_disconnect)
    monkeypatch.setattr(
        routes_games.manager,
        "broadcast_player_surrendered",
        fake_broadcast_player_surrendered,
    )
    monkeypatch.setattr(
        routes_games.manager,
        "broadcast_player_views",
        fake_broadcast_player_views,
    )

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.post(f"/games/{state.id}/surrender")

    assert response.status_code == 204
    assert session_auth.PLAYER_SESSION_COOKIE_NAME in response.headers.get("set-cookie", "")
    assert disconnect_calls == [(state.id, "Sam")]
    assert surrender_events == [(state.id, "Sam", ("Host", "Riley"))]
    assert view_broadcasts == [(state.id, ["Host", "Riley"])]


def test_delete_players_me_surrenders_active_game_and_broadcasts(monkeypatch):
    state = _build_active_state()
    del state.players["Sam"]
    state.current_player_id = "Riley"
    state.turn_number = 4

    disconnect_calls: list[tuple[str, str]] = []
    surrender_events: list[tuple[str, str, tuple[str, ...]]] = []
    view_broadcasts: list[tuple[str, list[str]]] = []

    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Sam"),
    )
    monkeypatch.setattr(
        routes_games,
        "surrender_game",
        lambda *, game_id, player_id: {"deleted": False, "state": state},
    )

    async def fake_disconnect(game_id: str, player_id: str) -> None:
        disconnect_calls.append((game_id, player_id))

    async def fake_broadcast_player_surrendered(
        game_id: str,
        *,
        event_id: str,
        player_id: str,
        recipient_ids: list[str],
    ) -> None:
        surrender_events.append((game_id, player_id, tuple(recipient_ids)))

    async def fake_broadcast_player_views(game_id: str, next_state: GameState) -> None:
        view_broadcasts.append((game_id, list(next_state.players.keys())))

    monkeypatch.setattr(routes_games.manager, "disconnect", fake_disconnect)
    monkeypatch.setattr(
        routes_games.manager,
        "broadcast_player_surrendered",
        fake_broadcast_player_surrendered,
    )
    monkeypatch.setattr(
        routes_games.manager,
        "broadcast_player_views",
        fake_broadcast_player_views,
    )

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.delete(f"/games/{state.id}/players/me")

    assert response.status_code == 204
    assert session_auth.PLAYER_SESSION_COOKIE_NAME in response.headers.get("set-cookie", "")
    assert disconnect_calls == [(state.id, "Sam")]
    assert surrender_events == [(state.id, "Sam", ("Host", "Riley"))]
    assert view_broadcasts == [(state.id, ["Host", "Riley"])]
