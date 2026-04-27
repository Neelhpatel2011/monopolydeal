from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.api import routes_games, ws_games
from backend.app.engine.state import DeckState, GameState, PlayerState
from backend.app.main import app
from backend.app.services import session_auth


def _build_state(
    *, game_id: str = "550e8400-e29b-41d4-a716-446655440000", game_code: str = "Q7K9P"
) -> GameState:
    return GameState(
        id=game_id,
        game_code=game_code,
        host_id="Host",
        players={
            "Host": PlayerState(id="Host", hand=["action_just_say_no"]),
            "Sam": PlayerState(id="Sam", hand=["multicolor_rent"]),
        },
        deck=DeckState(draw_pile=[], discard_pile=[]),
        current_player_id="Host",
    )


def _session_row(*, game_id: str, player_id: str, expires_in_days: int = 1, revoked_at: str | None = None):
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    return {
        "token_hash": session_auth.hash_player_session_token("raw-session-token"),
        "game_id": game_id,
        "player_id": player_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "revoked_at": revoked_at,
    }


def test_create_game_sets_http_only_session_cookie(monkeypatch):
    client = TestClient(app)
    state = _build_state()

    monkeypatch.setattr(routes_games, "create_game_lobby", lambda player_ids: state)
    monkeypatch.setattr(routes_games, "create_player_session_token", lambda game_id, player_id: "raw-session-token")

    response = client.post("/games", json={"player_name": "Host"})

    assert response.status_code == 200
    set_cookie = response.headers.get("set-cookie", "")
    assert f"{session_auth.PLAYER_SESSION_COOKIE_NAME}=raw-session-token" in set_cookie
    assert "HttpOnly" in set_cookie


def test_get_player_view_uses_authenticated_session_not_query_player(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(routes_games, "get_state", lambda game_id: state)
    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Host"),
    )

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")

        response = client.get(f"/games/{state.id}/view?player_id=Sam")

    assert response.status_code == 200
    payload = response.json()
    assert payload["you"]["id"] == "Host"
    assert payload["you"]["hand"] == ["action_just_say_no"]
    assert payload["others"][0]["id"] == "Sam"
    assert "hand" not in payload["others"][0]


def test_get_player_view_rejects_session_for_different_game(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(routes_games, "get_state", lambda game_id: state)
    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(
            game_id="123e4567-e89b-12d3-a456-426614174000",
            player_id="Host",
        ),
    )

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.get(f"/games/{state.id}/view")

    assert response.status_code == 403
    assert response.json()["detail"] == "Game session does not match requested game."


def test_get_player_view_rejects_expired_session(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(routes_games, "get_state", lambda game_id: state)
    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Host", expires_in_days=-1),
    )

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.get(f"/games/{state.id}/view")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or expired game session."


def test_start_game_uses_authenticated_player_not_query_param(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Sam"),
    )

    def fake_start_new_game(*, game_id: str, catalog, starter_player_id: str):
        assert game_id == state.id
        assert starter_player_id == "Sam"
        raise ValueError("Only the host can start the game.")

    monkeypatch.setattr(routes_games, "start_new_game", fake_start_new_game)

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.post(f"/games/{state.id}/start?player_id=Host")

    assert response.status_code == 403
    assert response.json()["detail"] == "Only the host can start the game."


def test_submit_action_uses_authenticated_actor_not_payload_player(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Host"),
    )

    async def fake_handle_action(game_id: str, req, catalog, *, actor_id: str):
        assert game_id == state.id
        assert actor_id == "Host"
        assert req.action_type == "end_turn"
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": "Handled securely.",
        }

    monkeypatch.setattr(routes_games, "handle_action", fake_handle_action)

    with TestClient(app) as client:
        client.cookies.set(session_auth.PLAYER_SESSION_COOKIE_NAME, "raw-session-token")
        response = client.post(
            f"/games/{state.id}/actions",
            json={"action_type": "end_turn", "player_id": "Sam"},
        )

    assert response.status_code == 200
    assert response.json()["message"] == "Handled securely."


def test_websocket_uses_cookie_session_identity(monkeypatch):
    state = _build_state()

    monkeypatch.setattr(
        session_auth.repo,
        "get_player_session",
        lambda token_hash: _session_row(game_id=state.id, player_id="Host"),
    )
    monkeypatch.setattr(ws_games.repo, "get_game", lambda game_id: state)

    with TestClient(app) as client:
        with client.websocket_connect(
            f"/ws/games/{state.id}",
            headers={"cookie": f"{session_auth.PLAYER_SESSION_COOKIE_NAME}=raw-session-token"},
        ) as websocket:
            payload = websocket.receive_json()

    assert payload["type"] == "state_update"
    assert payload["view"]["you"]["id"] == "Host"
    assert payload["view"]["you"]["hand"] == ["action_just_say_no"]
