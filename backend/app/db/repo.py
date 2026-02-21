from typing import Any, Dict, List, Optional

from ..engine.state import GameState
from ..schemas.response import GameSummary
from .supabase_client import supabase


def _require_single(res: Any) -> Dict[str, Any]:
    if not res.data:
        raise ValueError("Game not found.")
    return res.data


def create_game(state: GameState, status: str = "lobby") -> None:
    supabase.table("games").insert(
        {"id": state.id, "state": state.model_dump(), "status": status}
    ).execute()


def update_game(state: GameState, status: Optional[str] = None) -> None:
    payload: Dict[str, Any] = {"state": state.model_dump()}
    if status is not None:
        payload["status"] = status
    supabase.table("games").update(payload).eq("id", state.id).execute()


def get_game(game_id: str) -> GameState:
    res = (
        supabase.table("games")
        .select("state")
        .eq("id", game_id)
        .single()
        .execute()
    )
    row = _require_single(res)
    return GameState.model_validate(row["state"])


def delete_game(game_id: str) -> None:
    supabase.table("games").delete().eq("id", game_id).execute()


def list_games() -> List[GameSummary]:
    res = supabase.table("games").select("id,state,status").execute()
    games: List[GameSummary] = []
    for row in res.data or []:
        state = GameState.model_validate(row["state"])
        games.append(
            GameSummary(
                game_id=str(row["id"]),
                player_ids=list(state.players.keys()),
                started=row.get("status") != "lobby",
            )
        )
    return games


def insert_pending_payment(
    game_id: str, request_id: str, receiver_id: str, targets: Dict[str, int]
) -> None:
    supabase.table("pending_payments").insert(
        {
            "request_id": request_id,
            "game_id": game_id,
            "receiver_id": receiver_id,
            "targets": targets,
        }
    ).execute()


def get_pending_payment(request_id: str) -> Optional[Dict[str, Any]]:
    res = (
        supabase.table("pending_payments")
        .select("*")
        .eq("request_id", request_id)
        .single()
        .execute()
    )
    return res.data


def delete_pending_payment(request_id: str) -> None:
    supabase.table("pending_payments").delete().eq("request_id", request_id).execute()
