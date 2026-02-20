# FastAPI app entry point

# Placeholder for the main FastAPI application code
from pathlib import Path
from fastapi import FastAPI
from backend.app.services.card_catalog import load_catalog
from backend.app.api.routes_games import router as games_router
from backend.app.api.ws_games import router as ws_router

app = FastAPI()
cards_dir = Path(__file__).resolve().parents[1] / "cards" / "base"
app.state.card_catalog = load_catalog(str(cards_dir))
app.include_router(games_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return "Welcome to MonopolyDeal"
