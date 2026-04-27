import pytest
from fastapi.testclient import TestClient

from backend.app.api import routes_games
from backend.app.engine.state import DeckState, GameState, PlayerState
from backend.app.main import app
from backend.app.services import game_service
from backend.app.services.player_view import build_player_view


def _build_lobby_state(*, game_id: str = "550e8400-e29b-41d4-a716-446655440000", game_code: str = "Q7K9P") -> GameState:
    return GameState(
        id=game_id,
        game_code=game_code,
        host_id="Host",
        players={"Host": PlayerState(id="Host")},
        deck=DeckState(draw_pile=[], discard_pile=[]),
        current_player_id="Host",
    )


def test_create_game_lobby_assigns_short_code_from_allowed_alphabet(monkeypatch):
    created_states: list[GameState] = []

    def fake_create_game(state: GameState, status: str = "lobby") -> None:
        assert status == "lobby"
        created_states.append(state.model_copy(deep=True))

    monkeypatch.setattr(game_service.repo, "create_game", fake_create_game)

    state = game_service.create_game_lobby(["Host"])

    assert state.game_code is not None
    assert len(state.game_code) == game_service.GAME_CODE_LENGTH
    assert set(state.game_code).issubset(set(game_service.GAME_CODE_ALPHABET))
    assert created_states[0].game_code == state.game_code


def test_create_game_lobby_retries_on_game_code_conflict(monkeypatch):
    attempted_codes: list[str | None] = []
    generated_codes = iter(["ABCDE", "FGHJK"])

    def fake_generate_game_code() -> str:
        return next(generated_codes)

    def fake_create_game(state: GameState, status: str = "lobby") -> None:
        attempted_codes.append(state.game_code)
        if len(attempted_codes) == 1:
            raise ValueError("Game code conflict.")

    monkeypatch.setattr(game_service, "_generate_game_code", fake_generate_game_code)
    monkeypatch.setattr(game_service.repo, "create_game", fake_create_game)

    state = game_service.create_game_lobby(["Host"])

    assert attempted_codes == ["ABCDE", "FGHJK"]
    assert state.game_code == "FGHJK"


def test_join_game_by_code_normalizes_and_uses_existing_join_flow(monkeypatch):
    lobby_state = _build_lobby_state()
    captured_code: list[str] = []

    def fake_get_lobby_by_game_code(game_code: str) -> GameState:
        captured_code.append(game_code)
        return lobby_state

    def fake_get_game(game_id: str) -> GameState:
        assert game_id == lobby_state.id
        return lobby_state

    def fake_update_game(state: GameState, status: str | None = None) -> None:
        assert status is None

    monkeypatch.setattr(game_service.repo, "get_lobby_by_game_code", fake_get_lobby_by_game_code)
    monkeypatch.setattr(game_service.repo, "get_game", fake_get_game)
    monkeypatch.setattr(game_service.repo, "update_game", fake_update_game)

    result = game_service.join_game_by_code(" q7k9p ", "Sam")

    assert captured_code == ["Q7K9P"]
    assert result["player_id"] == "Sam"
    assert result["player_view"].game_id == lobby_state.id
    assert result["player_view"].game_code == "Q7K9P"


def test_join_game_rejects_player_when_lobby_has_four_players(monkeypatch):
    lobby_state = _build_lobby_state()
    for player_name in ("Casey", "Jordan", "Riley"):
        lobby_state.players[player_name] = PlayerState(id=player_name)

    def fake_get_game(game_id: str) -> GameState:
        assert game_id == lobby_state.id
        return lobby_state

    def fake_update_game(state: GameState, status: str | None = None) -> None:
        raise AssertionError("Full lobbies should not be persisted.")

    monkeypatch.setattr(game_service.repo, "get_game", fake_get_game)
    monkeypatch.setattr(game_service.repo, "update_game", fake_update_game)

    with pytest.raises(ValueError, match=r"Lobby is full \(4 players max\)\."):
        game_service.join_game(lobby_state.id, "Taylor")


def test_join_game_with_code_route_returns_player_view_and_game_code(monkeypatch):
    client = TestClient(app)

    def fake_join_game_by_code(*, game_code: str, player_name: str):
        state = _build_lobby_state()
        state.players[player_name] = PlayerState(id=player_name)
        return {
            "player_id": player_name,
            "player_view": build_player_view(state, player_name, app.state.card_catalog),
        }

    async def fake_broadcast_player_views(game_id: str, state: GameState) -> None:
        assert game_id == "550e8400-e29b-41d4-a716-446655440000"
        assert state.id == game_id

    monkeypatch.setattr(routes_games, "join_game_by_code", fake_join_game_by_code)
    monkeypatch.setattr(routes_games, "create_player_session_token", lambda game_id, player_id: "raw-session-token")
    monkeypatch.setattr(routes_games.manager, "broadcast_player_views", fake_broadcast_player_views)
    monkeypatch.setattr(routes_games, "get_state", lambda game_id: _build_lobby_state())

    response = client.post("/games/join", json={"game_code": "q7k9p", "player_name": "Sam"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["player_id"] == "Sam"
    assert payload["player_view"]["game_id"] == "550e8400-e29b-41d4-a716-446655440000"
    assert payload["player_view"]["game_code"] == "Q7K9P"


def test_join_game_with_code_route_returns_404_for_missing_lobby(monkeypatch):
    client = TestClient(app)

    def fake_join_game_by_code(*, game_code: str, player_name: str):
        raise ValueError("Game code not found or no longer joinable.")

    monkeypatch.setattr(routes_games, "join_game_by_code", fake_join_game_by_code)
    monkeypatch.setattr(routes_games, "create_player_session_token", lambda game_id, player_id: "raw-session-token")

    response = client.post("/games/join", json={"game_code": "ABCDE", "player_name": "Sam"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Game code not found or no longer joinable."


def test_join_game_with_code_route_returns_409_for_full_lobby(monkeypatch):
    client = TestClient(app)

    def fake_join_game_by_code(*, game_code: str, player_name: str):
        raise ValueError("Lobby is full (4 players max).")

    monkeypatch.setattr(routes_games, "join_game_by_code", fake_join_game_by_code)
    monkeypatch.setattr(routes_games, "create_player_session_token", lambda game_id, player_id: "raw-session-token")

    response = client.post("/games/join", json={"game_code": "ABCDE", "player_name": "Sam"})

    assert response.status_code == 409
    assert response.json()["detail"] == "Lobby is full (4 players max)."
