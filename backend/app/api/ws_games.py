from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.services.realtime import manager

router = APIRouter()


@router.websocket("/ws/games/{game_id}")
async def game_ws(websocket: WebSocket, game_id: str):
    player_id = websocket.query_params.get("player_id")
    if not player_id:
        await websocket.close(code=1008)
        return

    await manager.connect(game_id, player_id, websocket)
    try:
        while True:
            # Keep connection alive; ignore client messages for now
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(game_id, player_id)
