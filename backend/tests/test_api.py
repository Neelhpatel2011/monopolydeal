from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db import repo


client = TestClient(app)


def get_catalog():
    return app.state.card_catalog


def get_card_id(catalog, predicate):
    return next(cid for cid, cd in catalog.cards.items() if predicate(cd))


def pick_rent_setup(catalog):
    # Find a rent card and a color with properties
    for rent_id, rent_card in catalog.cards.items():
        if rent_card.kind != "rent":
            continue
        if rent_card.colors and "any" not in rent_card.colors:
            color_candidates = rent_card.colors
        else:
            color_candidates = list(catalog.rent_table.keys())
        for color in color_candidates:
            props = [
                cid
                for cid, cd in catalog.cards.items()
                if cd.kind == "property" and cd.meta.get("property_group") == color
            ]
            if props:
                return rent_id, color, props
    raise ValueError("No valid rent setup found.")


def test_create_and_get_state():
    res = client.post("/games", json={"player_ids": ["p1"]})
    assert res.status_code == 200
    game = res.json()
    game_id = game["game_id"]

    res2 = client.get(f"/games/{game_id}/state")
    assert res2.status_code == 200
    assert res2.json()["game_id"] == game_id


def test_join_and_start_game():
    res = client.post("/games", json={"player_ids": ["p1"]})
    game = res.json()
    game_id = game["game_id"]

    res2 = client.post(f"/games/{game_id}/players/p2")
    assert res2.status_code == 200
    assert res2.json()["player_id"] == "p2"

    res3 = client.post(f"/games/{game_id}/start")
    assert res3.status_code == 200
    state = repo.get_game(game_id)
    assert len(state.players["p1"].hand) > 0
    assert len(state.players["p2"].hand) > 0


def test_play_bank_action():
    res = client.post("/games", json={"player_ids": ["p1"]})
    game_id = res.json()["game_id"]
    client.post(f"/games/{game_id}/start")

    state = repo.get_game(game_id)
    p1_hand = state.players["p1"].hand
    catalog = get_catalog()

    bank_card_id = next(
        (cid for cid in p1_hand if catalog.cards[cid].kind != "property"), None
    )
    if not bank_card_id:
        # Inject a bankable card to make the test deterministic
        money_id = get_card_id(catalog, lambda cd: cd.kind == "money")
        state.players["p1"].hand.append(money_id)
        repo.update_game(state)
        bank_card_id = money_id

    res2 = client.post(
        f"/games/{game_id}/actions",
        json={
            "action_type": "play_bank",
            "player_id": "p1",
            "bank_card_id": bank_card_id,
        },
    )
    assert res2.status_code == 200
    assert res2.json()["response_type"] == "action_resolved"


def test_counterable_rent_payment_flow():
    catalog = get_catalog()
    rent_id, color, props = pick_rent_setup(catalog)
    money_id = max(
        (cid for cid, cd in catalog.cards.items() if cd.kind == "money"),
        key=lambda cid: catalog.cards[cid].money_value,
    )

    res = client.post("/games", json={"player_ids": ["p1", "p2"]})
    game_id = res.json()["game_id"]
    client.post(f"/games/{game_id}/start")

    # Force a predictable setup
    state = repo.get_game(game_id)
    state.players["p1"].hand = [rent_id]
    state.players["p1"].properties[color] = props[:1] if props else []
    state.players["p2"].bank = [money_id]
    repo.update_game(state)

    res1 = client.post(
        f"/games/{game_id}/actions",
        json={
            "action_type": "play_action_counterable",
            "player_id": "p1",
            "card_id": rent_id,
            "rent_color": color,
            "target_player_id": "p2",
        },
    )
    assert res1.status_code == 200
    assert res1.json()["response_type"] == "response_required"
    pending_id = res1.json()["response_required"]["pending_requests"][0]["pending_id"]

    res2 = client.post(
        f"/games/{game_id}/pending/{pending_id}/respond",
        json={"pending_id": pending_id, "player_id": "p2", "response": "accept"},
    )
    assert res2.status_code == 200
    assert res2.json()["response_type"] == "payment_required"

    payment_req = res2.json()["payment_request"]
    request_id = payment_req["request_id"]

    res3 = client.post(
        f"/games/{game_id}/payments",
        json={
            "request_id": request_id,
            "payer_id": "p2",
            "receiver_id": "p1",
            "bank": [money_id],
            "properties": [],
            "buildings": [],
        },
    )
    assert res3.status_code == 200
    assert res3.json()["response_type"] == "payment_applied"
