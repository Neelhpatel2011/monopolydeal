from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any, Dict

from fastapi import HTTPException, Request, Response, WebSocket

from ..db import repo

PLAYER_SESSION_COOKIE_NAME = "monopolydeal_guest_session"
PLAYER_SESSION_TTL_DAYS = 30


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def hash_player_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_player_session_token(game_id: str, player_id: str) -> str:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_player_session_token(raw_token)
    expires_at = _utcnow() + timedelta(days=PLAYER_SESSION_TTL_DAYS)
    repo.create_player_session(
        game_id=game_id,
        player_id=player_id,
        token_hash=token_hash,
        expires_at=expires_at.isoformat(),
    )
    return raw_token


def set_player_session_cookie(response: Response, request: Request, token: str) -> None:
    response.set_cookie(
        key=PLAYER_SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        max_age=PLAYER_SESSION_TTL_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_player_session_cookie(response: Response, request: Request) -> None:
    response.delete_cookie(
        key=PLAYER_SESSION_COOKIE_NAME,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
    )


def _validate_session_record(record: Dict[str, Any] | None, *, game_id: str) -> str:
    if not record:
        raise HTTPException(status_code=401, detail="Missing or expired game session.")

    if record.get("revoked_at"):
        raise HTTPException(status_code=401, detail="Missing or expired game session.")

    expires_at = _parse_timestamp(record.get("expires_at"))
    if expires_at is None or expires_at <= _utcnow():
        raise HTTPException(status_code=401, detail="Missing or expired game session.")

    if record.get("game_id") != game_id:
        raise HTTPException(status_code=403, detail="Game session does not match requested game.")

    player_id = str(record.get("player_id") or "").strip()
    if not player_id:
        raise HTTPException(status_code=401, detail="Missing or expired game session.")
    return player_id


def require_http_player_session(request: Request, game_id: str) -> str:
    raw_token = request.cookies.get(PLAYER_SESSION_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing or expired game session.")
    record = repo.get_player_session(hash_player_session_token(raw_token))
    return _validate_session_record(record, game_id=game_id)


def require_websocket_player_session(websocket: WebSocket, game_id: str) -> str:
    raw_token = websocket.cookies.get(PLAYER_SESSION_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing or expired game session.")
    record = repo.get_player_session(hash_player_session_token(raw_token))
    return _validate_session_record(record, game_id=game_id)
