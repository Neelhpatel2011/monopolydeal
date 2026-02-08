# Orchestrates: load state, apply engine, save, broadcast

# Placeholder for game service logic
import uuid
from typing import List

from ..engine.state import GameState, PlayerState, DeckState
from ..engine.effects.draw import build_deck
from .card_catalog import CardCatalog

STARTING_HAND_SIZE = 5


def create_new_game(player_ids: List[str], catalog: CardCatalog) -> GameState:
    # 1) Build and shuffle deck
    draw_pile = build_deck(catalog)
    deck = DeckState(draw_pile=draw_pile, discard_pile=[])

    # 2) Create players
    players = {pid: PlayerState(id=pid) for pid in player_ids}

    # 3) Deal starting hands
    for _ in range(STARTING_HAND_SIZE):
        for pid in player_ids:
            if not deck.draw_pile:
                raise ValueError("Deck is empty while dealing starting hands.")
            card_id = deck.draw_pile.pop(0)
            players[pid].hand.append(card_id)

    # 4) Create game state
    return GameState(
        id=str(uuid.uuid4()),
        players=players,
        deck=deck,
        current_player_id=player_ids[0] if player_ids else None,
        turn_number=1,
    )
