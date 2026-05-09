# FastAPI app entry point

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.card_catalog import load_catalog
from backend.app.api.routes_games import router as games_router
from backend.app.api.ws_games import router as ws_router

app = FastAPI()

LAN_DEV_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost|127\.0\.0\.1|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)


def _split_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    return [origin.strip().rstrip("/") for origin in raw_value.split(",") if origin.strip()]


def _origin_regex() -> str:
    production_regex = os.getenv("FRONTEND_ORIGIN_REGEX", "").strip()
    if not production_regex:
        return LAN_DEV_ORIGIN_REGEX
    return f"(?:{LAN_DEV_ORIGIN_REGEX})|(?:{production_regex})"


PRODUCTION_FRONTEND_ORIGINS = _split_origins(
    os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_ORIGIN")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *PRODUCTION_FRONTEND_ORIGINS,
    ],
    allow_origin_regex=_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cards_dir = Path(__file__).resolve().parents[1] / "cards" / "base"
app.state.card_catalog = load_catalog(str(cards_dir))
app.include_router(games_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return "Welcome to MonopolyDeal"


@app.get("/health")
async def health():
    return {"status": "ok"}
