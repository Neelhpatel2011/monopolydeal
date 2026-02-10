# FastAPI app entry point

# Placeholder for the main FastAPI application code
from fastapi import FastAPI
from backend.app.services.card_catalog import load_catalog

app = FastAPI()
app.state.card_catalog = load_catalog("backend/cards/base")
