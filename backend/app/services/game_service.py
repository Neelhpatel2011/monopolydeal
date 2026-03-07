# Orchestrates: load state, apply engine, save, broadcast

# Placeholder for game service logic
import uuid
from typing import Dict, List, Any

from ..engine.state import GameState, PlayerState, DeckState
from ..engine.effects.draw import build_deck, draw_cards
from .card_catalog import CardCatalog
from ..db import repo

from ..schemas.response import ActionResponse, PaymentResponse
from ..schemas.actions import ActionRequest, PaymentRequest, PendingResponseRequest

from ..engine.rules import start_action, respond_to_pending, check_win
from ..engine.effects.payment import process_payment
from .realtime import manager
from .player_view import build_player_view

STARTING_HAND_SIZE = 5


def create_game_lobby(player_ids: List[str]) -> GameState:
    """
    Create a game in the lobby state (no deck, no hands dealt).
    Players can join before the game is started.
    """
    if not player_ids:
        raise ValueError("Cannot create a lobby with no host player.")
    if len(player_ids) != 1:
        raise ValueError("Lobby must be created with exactly 1 host player.")

    host_id = player_ids[0].strip()
    if not host_id:
        raise ValueError("Host player name is required.")

    players = {host_id: PlayerState(id=host_id)}
    deck = DeckState(draw_pile=[], discard_pile=[])

    state = GameState(
        id=str(uuid.uuid4()),
        players=players,
        deck=deck,
        current_player_id=host_id,
        turn_number=1,
    )
    repo.create_game(state, status="lobby")
    return state


def start_new_game(game_id: str, catalog: CardCatalog) -> GameState:
    """
    Start a lobby game: build/shuffle deck and deal starting hands.
    """
    state = get_state(game_id)
    if not state.players:
        raise ValueError("Cannot start game with no players.")
    if len(state.players) < 2:
        raise ValueError("Need at least 2 players to start the game.")

    if state.deck.draw_pile or state.deck.discard_pile:
        raise ValueError("Game already started (deck is not empty).")

    # Build and shuffle deck
    state.deck.draw_pile = build_deck(catalog)
    state.deck.discard_pile = []

    # Deal starting hands
    player_ids = list(state.players.keys())
    for _ in range(STARTING_HAND_SIZE):
        for pid in player_ids:
            if not state.deck.draw_pile:
                raise ValueError("Deck is empty while dealing starting hands.")
            dealt_card_id = state.deck.draw_pile.pop(0)
            state.players[pid].hand.append(dealt_card_id)

    # Ensure current player is set
    if state.current_player_id is None:
        state.current_player_id = player_ids[0]

    # Start-of-turn draw for the first player.
    draw_cards(state, state.current_player_id, n=2)

    repo.update_game(state, status="active")
    return state


def join_game(game_id: str, player_name: str) -> Dict[str, object]:
    """
    Join an existing game by adding a new player.
    Does NOT deal cards; starting hands are dealt when the game is started.
    Returns a dict with player_id and the player's view.
    """
    state = get_state(game_id)

    # Lobby-only: once the deck exists, the game has started.
    if state.deck.draw_pile or state.deck.discard_pile:
        raise ValueError("Game already started; cannot join.")

    if player_name in state.players:
        raise ValueError("Player already exists in this game.")

    # Add new player (no dealing here)
    state.players[player_name] = PlayerState(id=player_name)

    repo.update_game(state)
    return {
        "player_id": player_name,
        "player_view": build_player_view(state, player_name),
    }


def get_state(game_id: str) -> GameState:
    """
    Docstring for get_state

    :param game_id: Description
    :return: Description
    :rtype: GameState

    Pulls GameState from either memory or a database! For the first iteration we will have GameState live in memory

    """
    # temporarily in memory for right now. later we will use a DB like PostGres

    return repo.get_game(game_id)


def add_to_pendingpayments(game_id: str, response: ActionResponse) -> None:
    """
    Helper: extract payment_request from an ActionResponse and store it in the DB.
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

    repo.insert_pending_payment(
        game_id,
        request_id,
        receiver_id,
        {t["player_id"]: t["amount"] for t in targets},
    )


def add_game_over(response: Dict[str, Any], state: GameState, catalog: CardCatalog) -> None:
    if response.get("status") != "ok":
        return
    winner_id = state.winner_id or check_win(state, catalog)
    if winner_id:
        state.winner_id = winner_id
        response["game_over"] = {"winner_id": winner_id}


async def handle_action(
    game_id: str, req: ActionRequest, catalog: CardCatalog
) -> ActionResponse:

    state = get_state(game_id)
    if state.winner_id:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": f"Game is over. Winner: {state.winner_id}.",
        }
    if req.action_type == "end_turn":
        if state.pending_actions:
            return {
                "status": "error",
                "response_type": "action_resolved",
                "message": "Cannot end turn while a pending response is unresolved.",
            }
        if repo.has_pending_payments(game_id):
            return {
                "status": "error",
                "response_type": "action_resolved",
                "message": "Cannot end turn while a pending payment is unresolved.",
            }
    response = start_action(state=state, catalog=catalog, **req.model_dump())

    add_to_pendingpayments(game_id, response)
    add_game_over(response, state, catalog)

    if response.get("status") == "ok":
        response["player_view"] = build_player_view(state, req.player_id)
    response.pop("state", None)
    if state.winner_id:
        repo.delete_pending_payments_for_game(game_id)
        repo.delete_game(game_id)
    else:
        repo.update_game(state)

    await manager.broadcast_player_views(game_id, state)
    return response


async def handle_pending(
    game_id, req: PendingResponseRequest, catalog: CardCatalog
) -> ActionResponse:

    state = get_state(game_id)
    if state.winner_id:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": f"Game is over. Winner: {state.winner_id}.",
        }

    if req.pending_id not in state.pending_actions:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": "Pending id not found.",
        }

    pending = state.pending_actions[req.pending_id]

    if (
        state.current_player_id is not None
        and pending.get("source_player") != state.current_player_id
    ):
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": f"Pending action does not belong to the current turn (current={state.current_player_id}).",
        }

    if pending["awaiting_player"] != req.player_id:
        return {
            "status": "error",
            "response_type": "action_resolved",
            "message": f"Pending response player mismatch: awaiting {pending['awaiting_player']}, got {req.player_id}.",
        }

    response = respond_to_pending(state=state, catalog=catalog, **req.model_dump())

    add_to_pendingpayments(game_id, response)
    add_game_over(response, state, catalog)

    if response.get("status") == "ok":
        response["player_view"] = build_player_view(state, req.player_id)
    response.pop("state", None)
    if state.winner_id:
        repo.delete_pending_payments_for_game(game_id)
        repo.delete_game(game_id)
    else:
        repo.update_game(state)

    await manager.broadcast_player_views(game_id, state)
    return response


async def handle_payment(
    game_id: str, req: PaymentRequest, catalog: CardCatalog
) -> PaymentResponse:

    state = get_state(game_id)
    if state.winner_id:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": f"Game is over. Winner: {state.winner_id}.",
        }

    pending = repo.get_pending_payment(req.request_id)
    if not pending:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Unknown payment request_id.",
        }

    receiver_id = pending["receiver_id"]
    targets = pending.get("targets", {})

    if pending.get("game_id") != game_id:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Payment request does not belong to this game.",
        }

    if req.receiver_id != receiver_id:
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": "Receiver does not match pending payment.",
        }

    if (
        state.current_player_id is not None
        and state.current_player_id != receiver_id
    ):
        return {
            "status": "error",
            "response_type": "payment_applied",
            "message": f"Payment does not belong to the current turn (current={state.current_player_id}).",
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
        repo.delete_pending_payment(req.request_id)
    add_game_over(response, state, catalog)
    if response.get("status") == "ok":
        response["player_view"] = build_player_view(state, req.payer_id)
    response.pop("state", None)
    if state.winner_id:
        repo.delete_pending_payments_for_game(game_id)
        repo.delete_game(game_id)
    else:
        repo.update_game(state)
    await manager.broadcast_player_views(game_id, state)
    return response
