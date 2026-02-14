# REST endpoints (create game, action, get state)

from typing import Dict

# Placeholder for game-related REST endpoints
from fastapi import APIRouter, Request
from backend.app.schemas.actions import (
    ActionRequest,
    CreateGameRequest,
    PendingResponseRequest,
    PaymentRequest,
)
from backend.app.schemas.response import (
    ActionResponse,
    JoinGameResponse,
    PaymentResponse,
)
from backend.app.services.game_service import (
    handle_action,
    handle_pending,
    handle_payment,
    create_game_lobby,
    start_new_game,
    GAMES,
)
from backend.app.services.game_service import join_game as join_game_service
from backend.app.services.game_service import get_state
from backend.app.engine.state import GameState


router = APIRouter()
# GET METHODS:


@router.get("/games", response_model=Dict[str, GameState])
def get_games():
    return GAMES


@router.get("/games/{game_id}/state", response_model=GameState)
def get_game_state(game_id: str) -> GameState:
    return get_state(game_id=game_id)


# DELETE METHODS:


@router.delete("/games/{game_id}")
def delete_game(game_id: str) -> None:
    if game_id not in GAMES:
        raise ValueError(f"Unknown game_id {game_id}")
    del GAMES[game_id]


# POST METHODS:


@router.post("/games", response_model=GameState)
def create_game(req: CreateGameRequest) -> GameState:

    state = create_game_lobby(player_ids=req.player_ids)
    GAMES[state.id] = state
    return state


@router.post("/games/{game_id}/players/{player_id}", response_model=JoinGameResponse)
def join_game(game_id: str, player_id: str) -> JoinGameResponse:
    return join_game_service(game_id=game_id, player_name=player_id)


@router.post("/games/{game_id}/start", response_model=GameState)
def start_game(game_id: str, request: Request) -> GameState:
    catalog = request.app.state.card_catalog
    return start_new_game(game_id=game_id, catalog=catalog)


@router.post("/games/{game_id}/actions", response_model=ActionResponse)
def submit_action_request(
    game_id: str, req: ActionRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog
    return handle_action(game_id, req, catalog)


@router.post(
    "/games/{game_id}/pending/{pending_id}/respond", response_model=ActionResponse
)
def submit_pending_request(
    game_id: str, pending_id: str, req: PendingResponseRequest, request: Request
) -> ActionResponse:
    catalog = request.app.state.card_catalog

    if req.pending_id != pending_id:
        raise ValueError(
            f"{req.pending_id} (request body) doesn't match up with {pending_id} (url)"
        )
    return handle_pending(game_id=game_id, req=req, catalog=catalog)


@router.post("/games/{game_id}/payments", response_model=PaymentResponse)
def submit_payment_request(
    game_id: str, req: PaymentRequest, request: Request
) -> PaymentResponse:
    catalog = request.app.state.card_catalog
    return handle_payment(game_id=game_id, req=req, catalog=catalog)
