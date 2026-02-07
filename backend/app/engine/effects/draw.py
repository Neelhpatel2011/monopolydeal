# Placeholder for draw effect logic
def draw_cards(state: GameState, player_id: str, n: int = 1) -> GameState:
    if player_id not in state.players:
        raise ValueError(f"Unknown player_id: {player_id}")

    for _ in range(n):
        if not state.deck.draw_pile:
            if not state.deck.discard_pile:
                raise ValueError("Cannot draw: no cards left in draw or discard pile.")
            # move discard into draw and shuffle
            state.deck.draw_pile = state.deck.discard_pile
            state.deck.discard_pile = []
            random.shuffle(state.deck.draw_pile)

        card_id = state.deck.draw_pile.pop(0)
        state.players[player_id].hand.append(card_id)

    return state


def build_deck(catalog: Dict[str, CardDef], seed=42) -> List[str]:
    deck: List[str] = []

    # catalog is key: card id, value: CardDef
    for cd in catalog.values():
        deck.extend([cd.id] * cd.copies)

    # Shuffle deck with seed
    random.seed(seed)
    random.shuffle(deck)

    # Check if deck is 110 cards long

    if len(deck) != 106:  # 110 - 4 helper cards

        raise ValueError(f"Deck size is {len(deck)}, expected 110.")

    return deck
