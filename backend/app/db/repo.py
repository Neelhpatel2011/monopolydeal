from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional

from postgrest.exceptions import APIError

from ..engine.state import GameState
from ..schemas.response import GameSummary
from .supabase_client import supabase


def _require_single(res: Any) -> Dict[str, Any]:
    if not res.data:
        raise ValueError("Game not found.")
    return res.data


def _require_uuid(value: str, *, name: str) -> None:
    try:
        uuid.UUID(value)
    except Exception:
        raise ValueError(f"Invalid {name}.")


def _is_unique_violation(error: APIError) -> bool:
    code = getattr(error, "code", None)
    if code == "23505":
        return True
    return "duplicate key value violates unique constraint" in str(error).lower()


def _hydrate_game_state(row: Dict[str, Any]) -> GameState:
    payload = dict(row["state"])
    if row.get("game_code") and not payload.get("game_code"):
        payload["game_code"] = row["game_code"]
    return GameState.model_validate(payload)


def create_game(state: GameState, status: str = "lobby") -> None:
    try:
        supabase.table("games").insert(
            {
                "id": state.id,
                "game_code": state.game_code,
                "state": state.model_dump(),
                "status": status,
            }
        ).execute()
    except APIError as error:
        if _is_unique_violation(error):
            raise ValueError("Game code conflict.") from error
        raise


def update_game(state: GameState, status: Optional[str] = None) -> None:
    payload: Dict[str, Any] = {
        "game_code": state.game_code,
        "state": state.model_dump(),
    }
    if status is not None:
        payload["status"] = status
    supabase.table("games").update(payload).eq("id", state.id).execute()


def get_game(game_id: str) -> GameState:
    _require_uuid(game_id, name="game_id")
    res = (
        supabase.table("games")
        .select("state,game_code")
        .eq("id", game_id)
        .single()
        .execute()
    )
    row = _require_single(res)
    return _hydrate_game_state(row)


def get_lobby_by_game_code(game_code: str) -> GameState:
    normalized_code = game_code.strip().upper()
    rows = (
        supabase.table("games")
        .select("state,game_code")
        .eq("game_code", normalized_code)
        .eq("status", "lobby")
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise ValueError("Game not found.")
    return _hydrate_game_state(rows[0])


def delete_game(game_id: str) -> None:
    _require_uuid(game_id, name="game_id")
    supabase.table("games").delete().eq("id", game_id).execute()


def list_games() -> List[GameSummary]:
    res = supabase.table("games").select("id,game_code,state,status").execute()
    games: List[GameSummary] = []
    for row in res.data or []:
        state = _hydrate_game_state(row)
        games.append(
            GameSummary(
                game_id=str(row["id"]),
                game_code=state.game_code or row.get("game_code"),
                player_ids=list(state.players.keys()),
                started=row.get("status") != "lobby",
            )
        )
    return games


def create_player_session(
    *, game_id: str, player_id: str, token_hash: str, expires_at: str
) -> None:
    _require_uuid(game_id, name="game_id")
    revoke_player_sessions_for_player(game_id=game_id, player_id=player_id)
    supabase.table("player_sessions").insert(
        {
            "token_hash": token_hash,
            "game_id": game_id,
            "player_id": player_id,
            "expires_at": expires_at,
        }
    ).execute()


def get_player_session(token_hash: str) -> Optional[Dict[str, Any]]:
    rows = (
        supabase.table("player_sessions")
        .select("*")
        .eq("token_hash", token_hash)
        .limit(1)
        .execute()
        .data
        or []
    )
    return rows[0] if rows else None


def revoke_player_sessions_for_player(game_id: str, player_id: str) -> None:
    _require_uuid(game_id, name="game_id")
    supabase.table("player_sessions").update(
        {"revoked_at": datetime.now(timezone.utc).isoformat()}
    ).eq("game_id", game_id).eq("player_id", player_id).execute()


def insert_pending_payment(
    game_id: str, request_id: str, receiver_id: str, targets: Dict[str, int]
) -> None:
    _require_uuid(game_id, name="game_id")
    supabase.table("pending_payments").insert(
        {
            "request_id": request_id,
            "game_id": game_id,
            "receiver_id": receiver_id,
            "targets": targets,
        }
    ).execute()


def get_pending_payment(request_id: str) -> Optional[Dict[str, Any]]:
    try:
        res = (
            supabase.table("pending_payments")
            .select("*")
            .eq("request_id", request_id)
            .limit(1)
            .execute()
        )
    except APIError:
        return None

    rows = res.data or []
    return rows[0] if rows else None


def delete_pending_payment(request_id: str) -> None:
    supabase.table("pending_payments").delete().eq("request_id", request_id).execute()


def has_pending_payments(game_id: str) -> bool:
    _require_uuid(game_id, name="game_id")
    res = (
        supabase.table("pending_payments")
        .select("request_id")
        .eq("game_id", game_id)
        .limit(1)
        .execute()
    )
    return bool(res.data)


def delete_pending_payments_for_game(game_id: str) -> None:
    _require_uuid(game_id, name="game_id")
    supabase.table("pending_payments").delete().eq("game_id", game_id).execute()
