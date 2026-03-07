# REST endpoints (create game, action, get state)

from typing import List

# Placeholder for game-related REST endpoints
from fastapi import APIRouter, Request, HTTPException, Query
import uuid
from backend.app.schemas.actions import (
    ActionRequest,
    CreateGameRequest,
    PendingResponseRequest,
    PaymentRequest,
)
from backend.app.schemas.response import (
    ActionResponse,
    GameSummary,
    JoinGameResponse,
    PaymentResponse,
)
from backend.app.services.game_service import (
    handle_action,
    handle_pending,
    handle_payment,
    create_game_lobby,
    start_new_game,
)
from backend.app.services.game_service import join_game as join_game_service

from backend.app.services.player_view import build_player_view, PlayerView
from backend.app.services.game_service import get_state
from backend.app.services.realtime import manager
from backend.app.db import repo


router = APIRouter()


def _map_value_error(e: ValueError) -> HTTPException:
    msg = str(e)
    if msg.startswith("Invalid game_id"):
        return HTTPException(status_code=422, detail=msg)
    if msg == "Game not found.":
        return HTTPException(status_code=404, detail=msg)
    if msg == "Game already started; cannot join.":
        return HTTPException(status_code=409, detail=msg)
    return HTTPException(status_code=400, detail=msg)


def _require_uuid(value: str, *, name: str) -> None:
    try:
        uuid.UUID(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"Invalid {name}: {value!r}.")


# GET METHODS:


@router.get("/games", response_model=List[GameSummary])
def get_games() -> List[GameSummary]:
    return repo.list_games()


@router.get("/games/{game_id}/state", response_model=GameSummary)
def get_game_state(game_id: str) -> GameSummary:
    _require_uuid(game_id, name="game_id")
    try:
        state = get_state(game_id=game_id)
    except ValueError as e:
        raise _map_value_error(e)
    return GameSummary(
        game_id=state.id,
        player_ids=list(state.players.keys()),
        started=bool(state.deck.draw_pile or state.deck.discard_pile),
    )


@router.get("/games/{game_id}/view", response_model=PlayerView)
def get_player_view(
    game_id: str,
    player_id: str = Query(..., description="Player id to render view for"),
) -> PlayerView:
    _require_uuid(game_id, name="game_id")
    try:
        state = get_state(game_id=game_id)
    except ValueError as e:
        raise _map_value_error(e)
    if player_id not in state.players:
        raise HTTPException(status_code=404, detail="Unknown player_id")
    return build_player_view(state, player_id)


# DELETE METHODS:


@router.delete("/games/{game_id}")
def delete_game(game_id: str) -> None:
    _require_uuid(game_id, name="game_id")
    try:
        repo.delete_game(game_id)
    except ValueError as e:
        raise _map_value_error(e)


# POST METHODS:


@router.post("/games", response_model=GameSummary)
def create_game(req: CreateGameRequest) -> GameSummary:

    try:
        state = create_game_lobby(player_ids=[req.player_name or ""])
    except ValueError as e:
        raise _map_value_error(e)
    return GameSummary(
        game_id=state.id,
        player_ids=list(state.players.keys()),
        started=False,
    )


@router.post("/games/{game_id}/players/{player_id}", response_model=JoinGameResponse)
async def join_game(game_id: str, player_id: str) -> JoinGameResponse:
    _require_uuid(game_id, name="game_id")
    try:
        res = join_game_service(game_id=game_id, player_name=player_id)
    except ValueError as e:
        # e.g. game already started, player already exists, unknown game id, etc.
        raise _map_value_error(e)
    # Push updates to all connected clients (so hosts don't need to refresh).
    await manager.broadcast_player_views(game_id, get_state(game_id=game_id))
    return res


@router.post("/games/{game_id}/start", response_model=GameSummary)
async def start_game(game_id: str, request: Request) -> GameSummary:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    try:
        state = start_new_game(game_id=game_id, catalog=catalog)
    except ValueError as e:
        raise _map_value_error(e)
    # Push dealt hands + new state to all connected players.
    await manager.broadcast_player_views(game_id, state)
    return GameSummary(
        game_id=state.id,
        player_ids=list(state.players.keys()),
        started=True,
    )


@router.post("/games/{game_id}/actions", response_model=ActionResponse)
async def submit_action_request(
    game_id: str, req: ActionRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    try:
        return await handle_action(game_id, req, catalog)
    except ValueError as e:
        raise _map_value_error(e)


@router.post(
    "/games/{game_id}/pending/{pending_id}/respond", response_model=ActionResponse
)
async def submit_pending_request(
    game_id: str, pending_id: str, req: PendingResponseRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog

    if req.pending_id != pending_id:
        raise ValueError(
            f"{req.pending_id} (request body) doesn't match up with {pending_id} (url)"
        )
    _require_uuid(game_id, name="game_id")
    try:
        return await handle_pending(game_id=game_id, req=req, catalog=catalog)
    except ValueError as e:
        raise _map_value_error(e)


@router.post("/games/{game_id}/payments", response_model=PaymentResponse)
async def submit_payment_request(
    game_id: str, req: PaymentRequest, request: Request
) -> PaymentResponse:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    try:
        return await handle_payment(game_id=game_id, req=req, catalog=catalog)
    except ValueError as e:
        raise _map_value_error(e)
