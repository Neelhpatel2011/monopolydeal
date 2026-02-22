import sys
from pathlib import Path

import pytest

# Ensure repo root is on sys.path so `backend.*` imports work under pytest.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.services.card_catalog import load_catalog


@pytest.fixture(scope="session")
def catalog():
    return load_catalog("backend/cards/base")


# @pytest.fixture()
# def state(catalog):
#     # Create lobby, register it, then start (deal hands)
#     state = create_game_lobby(["p1", "p2"])
#     GAMES[state.id] = state
#     return start_new_game(state.id, catalog)
