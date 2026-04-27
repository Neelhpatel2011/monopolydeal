import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.db import repo
from backend.app.services.player_view import build_player_view
from backend.app.services.realtime import manager

router = APIRouter()

PING_INTERVAL_S = 20.0
MAX_MISSED_PINGS = 3


@router.websocket("/ws/games/{game_id}")
async def game_ws(websocket: WebSocket, game_id: str):
    player_id = websocket.query_params.get("player_id")
    if not player_id:
        await websocket.close(code=1008)
        return

    await manager.connect(game_id, player_id, websocket)

    # Send an immediate snapshot so reconnects/resumes don't require polling.
    try:
        state = repo.get_game(game_id)
    except Exception:
        await websocket.close(code=1008)
        return

    if player_id not in state.players:
        await websocket.close(code=1008)
        return

    view = build_player_view(state, player_id)
    await manager.send_to_player(
        game_id, player_id, {"type": "state_update", "view": view.model_dump()}
    )

    try:
        missed_pings = 0
        while True:
            # App-level heartbeat: Starlette doesn't expose WS ping frames directly.
            # Clients can either reply with "pong"/{"type":"pong"} or just send any message.
            try:
                msg = await asyncio.wait_for(
                    websocket.receive_text(), timeout=PING_INTERVAL_S
                )
                missed_pings = 0

                if msg == "ping":
                    await websocket.send_text("pong")
                    continue

                # Allow JSON heartbeats too.
                try:
                    payload = json.loads(msg)
                except Exception:
                    payload = None

                if isinstance(payload, dict) and payload.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                missed_pings += 1
                await websocket.send_json({"type": "ping"})
                if missed_pings >= MAX_MISSED_PINGS:
                    await websocket.close(code=1001)
                    return
    except WebSocketDisconnect:
        await manager.disconnect(game_id, player_id)
    except Exception:
        await manager.disconnect(game_id, player_id)
