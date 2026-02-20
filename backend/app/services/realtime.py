from typing import Dict

from fastapi import WebSocket

from backend.app.engine.state import GameState
from backend.app.services.player_view import build_player_view


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, game_id: str, player_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(game_id, {})[player_id] = websocket

    async def disconnect(self, game_id: str, player_id: str) -> None:
        if game_id in self._connections:
            self._connections[game_id].pop(player_id, None)
            if not self._connections[game_id]:
                del self._connections[game_id]

    async def send_to_player(self, game_id: str, player_id: str, payload: dict) -> None:
        ws = self._connections.get(game_id, {}).get(player_id)
        if ws:
            await ws.send_json(payload)

    async def broadcast_player_views(self, game_id: str, state: GameState) -> None:
        for player_id in state.players.keys():
            view = build_player_view(state, player_id)
            await self.send_to_player(
                game_id,
                player_id,
                {"type": "state_update", "view": view.model_dump()},
            )


manager = ConnectionManager()
