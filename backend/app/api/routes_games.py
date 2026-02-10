# REST endpoints (create game, action, get state)

# Placeholder for game-related REST endpoints
from fastapi import APIRouter, Request
from backend.app.schemas.actions import ActionRequest
from backend.app.services.game_service import handle_action


router = APIRouter()


@router.post("/games/{game_id}/actions")
def submit_action_request(game_id: str, req: ActionRequest, request: Request):
    catalog = request.app.state.card_catalog
    return handle_action(game_id, req, catalog)
