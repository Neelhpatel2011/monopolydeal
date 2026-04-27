# REST endpoints (create game, action, get state)

from typing import List

# Placeholder for game-related REST endpoints
from fastapi import APIRouter, Request, HTTPException, Response
import uuid
from backend.app.schemas.actions import (
    ActionRequest,
    CreateGameRequest,
    JoinGameByCodeRequest,
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
    join_game_by_code,
    leave_game_lobby,
    start_new_game,
)
from backend.app.services.game_service import join_game as join_game_service

from backend.app.services.player_view import build_player_view, PlayerView
from backend.app.services.game_service import get_state
from backend.app.services.realtime import manager
from backend.app.services.session_auth import (
    clear_player_session_cookie,
    create_player_session_token,
    require_http_player_session,
    set_player_session_cookie,
)
from backend.app.db import repo


router = APIRouter()


def _map_value_error(e: ValueError) -> HTTPException:
    msg = str(e)
    if msg.startswith("Invalid game_id"):
        return HTTPException(status_code=422, detail=msg)
    if msg == "Game not found.":
        return HTTPException(status_code=404, detail=msg)
    if msg == "Unknown player_id.":
        return HTTPException(status_code=404, detail=msg)
    if msg == "Game already started; cannot join.":
        return HTTPException(status_code=409, detail=msg)
    if msg == "Game already started; cannot leave lobby.":
        return HTTPException(status_code=409, detail=msg)
    if msg.startswith("Lobby is full (") and msg.endswith(" players max)."):
        return HTTPException(status_code=409, detail=msg)
    if msg == "Only the host can start the game.":
        return HTTPException(status_code=403, detail=msg)
    if msg == "Game code not found or no longer joinable.":
        return HTTPException(status_code=404, detail=msg)
    if msg == "Could not allocate game code, please try again.":
        return HTTPException(status_code=503, detail=msg)
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
        game_code=state.game_code,
        player_ids=list(state.players.keys()),
        started=bool(state.deck.draw_pile or state.deck.discard_pile),
    )


@router.get("/games/{game_id}/view", response_model=PlayerView)
def get_player_view(
    game_id: str,
    request: Request,
) -> PlayerView:
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        state = get_state(game_id=game_id)
    except ValueError as e:
        raise _map_value_error(e)
    if player_id not in state.players:
        raise HTTPException(status_code=404, detail="Unknown player_id")
    return build_player_view(state, player_id, request.app.state.card_catalog)


# DELETE METHODS:


@router.delete("/games/{game_id}")
def delete_game(game_id: str, request: Request, response: Response) -> None:
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        state = get_state(game_id=game_id)
    except ValueError as e:
        raise _map_value_error(e)
    if state.host_id and player_id != state.host_id:
        raise HTTPException(status_code=403, detail="Only the host can delete the game.")
    try:
        repo.delete_game(game_id)
    except ValueError as e:
        raise _map_value_error(e)
    clear_player_session_cookie(response, request)


@router.delete("/games/{game_id}/players/me", status_code=204)
async def leave_game(game_id: str, request: Request, response: Response) -> None:
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        result = leave_game_lobby(game_id=game_id, player_id=player_id)
    except ValueError as e:
        raise _map_value_error(e)

    await manager.disconnect(game_id, player_id)
    clear_player_session_cookie(response, request)
    state = result.get("state")
    if state is not None:
        await manager.broadcast_player_views(game_id, state)


# POST METHODS:


@router.post("/games", response_model=GameSummary)
def create_game(req: CreateGameRequest, request: Request, response: Response) -> GameSummary:

    try:
        state = create_game_lobby(player_ids=[req.player_name or ""])
    except ValueError as e:
        raise _map_value_error(e)
    session_token = create_player_session_token(state.id, state.host_id or (req.player_name or ""))
    set_player_session_cookie(response, request, session_token)
    return GameSummary(
        game_id=state.id,
        game_code=state.game_code,
        player_ids=list(state.players.keys()),
        started=False,
    )


@router.post("/games/join", response_model=JoinGameResponse)
async def join_game_with_code(
    req: JoinGameByCodeRequest, request: Request, response: Response
) -> JoinGameResponse:
    try:
        res = join_game_by_code(game_code=req.game_code, player_name=req.player_name)
    except ValueError as e:
        raise _map_value_error(e)
    session_token = create_player_session_token(
        res["player_view"].game_id,
        res["player_id"],
    )
    set_player_session_cookie(response, request, session_token)
    player_view = res["player_view"]
    await manager.broadcast_player_views(player_view.game_id, get_state(game_id=player_view.game_id))
    return res


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
async def start_game(
    game_id: str,
    request: Request,
) -> GameSummary:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        state = start_new_game(
            game_id=game_id,
            catalog=catalog,
            starter_player_id=player_id,
        )
    except ValueError as e:
        raise _map_value_error(e)
    # Push dealt hands + new state to all connected players.
    await manager.broadcast_player_views(game_id, state)
    return GameSummary(
        game_id=state.id,
        game_code=state.game_code,
        player_ids=list(state.players.keys()),
        started=True,
    )


@router.post("/games/{game_id}/actions", response_model=ActionResponse)
async def submit_action_request(
    game_id: str, req: ActionRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        return await handle_action(game_id, req, catalog, actor_id=player_id)
    except ValueError as e:
        raise _map_value_error(e)


@router.post(
    "/games/{game_id}/pending/{pending_id}/respond", response_model=ActionResponse
)
async def submit_pending_request(
    game_id: str, pending_id: str, req: PendingResponseRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)

    if req.pending_id != pending_id:
        raise HTTPException(
            status_code=400,
            detail=f"{req.pending_id} (request body) doesn't match up with {pending_id} (url)",
        )
    try:
        return await handle_pending(
            game_id=game_id,
            req=req,
            catalog=catalog,
            actor_id=player_id,
        )
    except ValueError as e:
        raise _map_value_error(e)


@router.post("/games/{game_id}/payments", response_model=PaymentResponse)
async def submit_payment_request(
    game_id: str, req: PaymentRequest, request: Request
) -> PaymentResponse:
    catalog = request.app.state.card_catalog
    _require_uuid(game_id, name="game_id")
    player_id = require_http_player_session(request, game_id)
    try:
        return await handle_payment(
            game_id=game_id,
            req=req,
            catalog=catalog,
            actor_id=player_id,
        )
    except ValueError as e:
        raise _map_value_error(e)
