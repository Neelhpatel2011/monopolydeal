# Orchestrates: load state, apply engine, save, broadcast

# Placeholder for game service logic
import uuid
from typing import Dict, List, Any

from ..engine.state import GameState, PlayerState, DeckState
from ..engine.effects.draw import build_deck
from .card_catalog import CardCatalog

from ..schemas.response import ActionResponse, PaymentResponse
from ..schemas.actions import ActionRequest, PaymentRequest, PendingResponseRequest

from ..engine.rules import start_action, respond_to_pending
from ..engine.effects.payment import process_payment

# In-memory game store for MVP
GAMES: Dict[str, GameState] = {}
PENDING_PAYMENTS: Dict[str, Dict[str, Any]] = {}

STARTING_HAND_SIZE = 5


def create_new_game(player_ids: List[str], catalog: CardCatalog) -> GameState:

    # Deal out and hands and initiate game after players have joined the game!

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


def join_game(game_id: str, player_name: str) -> Dict[str, object]:
    """
    Join an existing game by adding a new player.
    Does NOT deal cards; starting hands are dealt when the game is started.
    Returns a dict with player_id and the updated state.
    """
    if game_id not in GAMES:
        raise ValueError("Unknown game_id.")

    state = get_state(game_id)

    if player_name in state.players:
        raise ValueError("Player already exists in this game.")

    # Add new player (no dealing here)
    state.players[player_name] = PlayerState(id=player_name)

    return {"player_id": player_name, "state": state}


def get_state(game_id: str) -> GameState:
    """
    Docstring for get_state

    :param game_id: Description
    :return: Description
    :rtype: GameState

    Pulls GameState from either memory or a database! For the first iteration we will have GameState live in memory

    """
    # temporarily in memory for right now. later we will use a DB like PostGres

    if game_id not in GAMES:
        return ValueError("Unknown game id!")
    return GAMES[game_id]


def add_to_pendingpayments(response: Dict[str, Any]) -> None:
    """
    Helper: extract payment_request from an ActionResponse and store it in PENDING_PAYMENTS.
    No-op if the response is not payment_required or is missing fields.
    """
    if response.get("status") != "ok":
        return
    if response.get("response_type") != "payment_required":
        return

    payment = response.get("payment_request") or {}
    request_id = payment.get("request_id")
    receiver_id = payment.get("receiver_id")
    targets = payment.get("targets") or []

    if not request_id or not receiver_id or not targets:
        return

    PENDING_PAYMENTS[request_id] = {
        "receiver_id": receiver_id,
        "targets": {t["player_id"]: t["amount"] for t in targets},
    }


def handle_action(
    game_id: str, req: ActionRequest, catalog: CardCatalog
) -> ActionResponse:
    # TODO: validates player, locks game

    state = get_state(game_id)
    response = start_action(state=state, catalog=catalog, **req.model_dump())

    add_to_pendingpayments(response)

    return response


def handle_pending(
    game_id, req: PendingResponseRequest, catalog: CardCatalog
) -> ActionResponse:

    state = get_state(game_id)

    if req.pending_id not in state.pending_actions:
        raise ValueError("Pending ID is not in GameState Pending Actions List")

    if state.pending_actions[req.pending_id]["awaiting_player"] != req.player_id:
        raise ValueError(
            f"Pending response player mismatch: awaiting {state.pending_actions[req.pending_id]['awaiting_player']}, got {req.player_id}."
        )

    state = get_state(game_id)
    response = respond_to_pending(state=state, catalog=catalog, **req.model_dump())

    add_to_pendingpayments(response)

    return response


def handle_payment(
    game_id: str, req: PaymentRequest, catalog: CardCatalog
) -> PaymentResponse:

    state = get_state(game_id)

    if req.request_id not in PENDING_PAYMENTS:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Unknown payment request_id.",
        }

    pending = PENDING_PAYMENTS[req.request_id]
    receiver_id = pending["receiver_id"]
    targets = pending[targets]

    if req.receiver_id != receiver_id:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Receiver does not match pending payment.",
        }

    if req.payer_id not in targets:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Payer is not a target for this payment.",
        }

    amount = targets[req.payer_id]

    response = process_payment(
        state=state,
        payer_id=req.payer_id,
        receiver_id=receiver_id,
        catalog=catalog,
        user_bank_payment_ids=req.bank,
        user_property_payment_ids=req.properties,
        user_building_payment_ids=req.buildings,
        money_charged=amount,
    )

    if response.get("status") == "ok":
        del PENDING_PAYMENTS[req.request_id]
    return response
