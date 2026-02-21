# REST endpoints (create game, action, get state)

from typing import List

# Placeholder for game-related REST endpoints
from fastapi import APIRouter, Request, HTTPException, Query
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
from backend.app.db import repo


router = APIRouter()
# GET METHODS:


@router.get("/games", response_model=List[GameSummary])
def get_games() -> List[GameSummary]:
    return repo.list_games()


@router.get("/games/{game_id}/state", response_model=GameSummary)
def get_game_state(game_id: str) -> GameSummary:
    state = get_state(game_id=game_id)
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
    state = get_state(game_id=game_id)
    if player_id not in state.players:
        raise HTTPException(status_code=404, detail="Unknown player_id")
    return build_player_view(state, player_id)


# DELETE METHODS:


@router.delete("/games/{game_id}")
def delete_game(game_id: str) -> None:
    repo.delete_game(game_id)


# POST METHODS:


@router.post("/games", response_model=GameSummary)
def create_game(req: CreateGameRequest) -> GameSummary:

    state = create_game_lobby(player_ids=req.player_ids)
    return GameSummary(
        game_id=state.id,
        player_ids=list(state.players.keys()),
        started=False,
    )


@router.post("/games/{game_id}/players/{player_id}", response_model=JoinGameResponse)
def join_game(game_id: str, player_id: str) -> JoinGameResponse:
    return join_game_service(game_id=game_id, player_name=player_id)


@router.post("/games/{game_id}/start", response_model=GameSummary)
def start_game(game_id: str, request: Request) -> GameSummary:
    catalog = request.app.state.card_catalog
    state = start_new_game(game_id=game_id, catalog=catalog)
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
    return await handle_action(game_id, req, catalog)


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
    return await handle_pending(game_id=game_id, req=req, catalog=catalog)


@router.post("/games/{game_id}/payments", response_model=PaymentResponse)
async def submit_payment_request(
    game_id: str, req: PaymentRequest, request: Request
) -> PaymentResponse:
    catalog = request.app.state.card_catalog
    return await handle_payment(game_id=game_id, req=req, catalog=catalog)
