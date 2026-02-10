# Orchestrates: load state, apply engine, save, broadcast

# Placeholder for game service logic
import uuid
from typing import List

from ..engine.state import GameState, PlayerState, DeckState
from ..engine.effects.draw import build_deck
from .card_catalog import CardCatalog

from ..schemas.response import ActionResponse,

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


def join_game(game_id, player_name):
    # TODO: Create the join_game function with two arguments: 1. The game id, 2. the player name
    return NotImplementedError


def get_state(game_id) -> GameState:
    """
    Docstring for get_state

    :param game_id: Description
    :return: Description
    :rtype: GameState

    Pulls GameState from either memory or a database! For the first iteration we will have GameState live in memory

    """

    # TODO: Return the current GameState
    return NotImplementedError


def handle_action(game_id, ActionRequest):
    # TODO: Calls start_action(), validates player, locks game



    return NotImplementedError


def handle_pending(game_id, PendingResponseRequest) -> ActionResponse:
    # TODO: validate pending_id and awaiting player, calls respond_to_pending() function
    
    return NotImplementedError


def handle_payment(game_id, PaymentRequest):
    # TODO: Validates request_id and payer, calls process_payment()
    return NotImplementedError
