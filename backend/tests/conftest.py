import sys
from pathlib import Path

import pytest

# Ensure repo root is on sys.path so `backend.*` imports work under pytest.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.services.card_catalog import load_catalog
from backend.app.services.game_service import create_new_game


@pytest.fixture(scope="session")
def catalog():
    return load_catalog("backend/cards/base")


@pytest.fixture()
def state(catalog):
    return create_new_game(["p1", "p2"], catalog)
