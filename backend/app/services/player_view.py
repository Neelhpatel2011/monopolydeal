from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from ..engine.effects.steal import find_card_color
from ..engine.state import GameState, PlayerState, resolve_host_id
from .card_catalog import CardCatalog, load_catalog


ActionFieldName = Literal[
    "property_color",
    "rent_color",
    "target_player_id",
    "steal_card_id",
    "give_card_id",
    "steal_color",
]


class PendingActionPrompt(BaseModel):
    pending_id: str
    source_player: str
    card_id: str
    prompt: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class TurnActionView(BaseModel):
    player_id: str
    action_type: str
    card_ids: List[str] = Field(default_factory=list)


class PaymentParticipantView(BaseModel):
    player_id: str
    amount: int
    status: str
    request_id: Optional[str] = None
    paid_amount: int = 0


class PaymentTrackerView(BaseModel):
    group_id: str
    receiver_id: str
    source_player_id: str
    card_id: Optional[str] = None
    participants: List[PaymentParticipantView] = Field(default_factory=list)


class ChoiceOptionView(BaseModel):
    value: str
    label: str
    detail: Optional[str] = None


class FieldOptionsView(BaseModel):
    field: ActionFieldName
    options: List[ChoiceOptionView] = Field(default_factory=list)
    by_target: Dict[str, List[ChoiceOptionView]] = Field(default_factory=dict)


class HandActionView(BaseModel):
    card_id: str
    card_kind: str
    action_type: str
    can_bank: bool = False
    available_double_rent_count: int = 0
    available_double_rent_card_id: Optional[str] = None
    required_fields: List[ActionFieldName] = Field(default_factory=list)
    chosen_defaults: Dict[ActionFieldName, str] = Field(default_factory=dict)
    fields: List[FieldOptionsView] = Field(default_factory=list)


class WildReassignmentView(BaseModel):
    card_id: str
    available_colors: List[str] = Field(default_factory=list)


class PropertySetSummaryView(BaseModel):
    color: str
    count: int
    target_size: int
    is_complete: bool
    current_rent: Optional[int] = None
    building_bonus: int = 0
    wild_count: int = 0
    buildings: List[str] = Field(default_factory=list)
    wild_reassignments: List[WildReassignmentView] = Field(default_factory=list)


class PlayerPublicView(BaseModel):
    id: str
    hand_count: int = 0
    bank: List[str] = Field(default_factory=list)
    properties: Dict[str, List[str]] = Field(default_factory=dict)
    buildings: Dict[str, List[str]] = Field(default_factory=dict)
    property_summaries: Dict[str, PropertySetSummaryView] = Field(default_factory=dict)


class PlayerPrivateView(PlayerPublicView):
    hand: List[str] = Field(default_factory=list)
    available_actions: Dict[str, HandActionView] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _sync_hand_count(self) -> "PlayerPrivateView":
        self.hand_count = len(self.hand)
        return self


class PlayerView(BaseModel):
    game_id: str
    game_code: Optional[str] = None
    host_id: Optional[str] = None
    started: bool = False
    you: PlayerPrivateView
    others: List[PlayerPublicView] = Field(default_factory=list)
    pending_prompts: List[PendingActionPrompt] = Field(default_factory=list)
    turn_actions: List[TurnActionView] = Field(default_factory=list)
    payment_trackers: List[PaymentTrackerView] = Field(default_factory=list)
    deck_count: int
    discard_pile: List[str] = Field(default_factory=list)
    current_player_id: Optional[str] = None
    turn_number: int = 1
    actions_taken: int = 0
    game_over: Optional[Dict[str, str]] = None


@lru_cache(maxsize=1)
def _default_catalog() -> CardCatalog:
    cards_dir = Path(__file__).resolve().parents[2] / "cards" / "base"
    return load_catalog(str(cards_dir))


def _format_color_label(color: str) -> str:
    if color == "light_blue":
        return "Light Blue"
    if color == "dark_blue":
        return "Dark Blue"
    return color.replace("_", " ").title()


def _format_money(value: int) -> str:
    return f"${value}M"


def _get_set_size(catalog: CardCatalog, color: str) -> int:
    return len(catalog.rent_table.get(color, []))


def _get_building_bonus(catalog: CardCatalog, building_ids: List[str]) -> int:
    total = 0
    for card_id in building_ids:
        card = catalog.cards.get(card_id)
        if not card or not card.play:
            continue
        total += int(card.play.params.get("rent_bonus", 0))
    return total


def _build_property_summary(
    *,
    player: PlayerState,
    color: str,
    card_ids: List[str],
    building_ids: List[str],
    catalog: CardCatalog,
) -> PropertySetSummaryView:
    target_size = _get_set_size(catalog, color)
    is_complete = target_size > 0 and len(card_ids) >= target_size
    property_cards = [catalog.cards[card_id] for card_id in card_ids if card_id in catalog.cards]
    base_property = next((card for card in property_cards if card.kind == "property"), None)
    rent_table = base_property.rent_by_count if base_property and base_property.rent_by_count else catalog.rent_table.get(color, [])
    rent_index = max(0, min(len(card_ids), len(rent_table)) - 1)
    base_rent = rent_table[rent_index] if rent_table else None
    building_bonus = _get_building_bonus(catalog, building_ids)
    wild_reassignments: List[WildReassignmentView] = []

    for card_id in card_ids:
        card = catalog.cards.get(card_id)
        if not card or card.kind != "property_wild":
            continue
        if card.colors and "any" in card.colors:
            available_colors = [entry for entry in catalog.rent_table.keys() if entry != color]
        else:
            available_colors = [entry for entry in (card.colors or []) if entry != color]
        wild_reassignments.append(
            WildReassignmentView(card_id=card_id, available_colors=available_colors)
        )

    return PropertySetSummaryView(
        color=color,
        count=len(card_ids),
        target_size=target_size,
        is_complete=is_complete,
        current_rent=(base_rent + building_bonus) if base_rent is not None else None,
        building_bonus=building_bonus,
        wild_count=sum(1 for card in property_cards if card.kind == "property_wild"),
        buildings=[
            catalog.cards[building_id].name
            for building_id in building_ids
            if building_id in catalog.cards
        ],
        wild_reassignments=wild_reassignments,
    )


def _build_property_summaries(player: PlayerState, catalog: CardCatalog) -> Dict[str, PropertySetSummaryView]:
    summaries: Dict[str, PropertySetSummaryView] = {}
    for color, card_ids in player.properties.items():
        summaries[color] = _build_property_summary(
            player=player,
            color=color,
            card_ids=card_ids,
            building_ids=player.buildings.get(color, []),
            catalog=catalog,
        )
    return summaries


def _build_choice_option(value: str, *, label: Optional[str] = None, detail: Optional[str] = None) -> ChoiceOptionView:
    return ChoiceOptionView(value=value, label=label or value, detail=detail)


def _get_available_double_rent_modifier(actor: PlayerState, catalog: CardCatalog) -> tuple[str | None, int]:
    modifier_ids: List[str] = []
    for held_card_id in actor.hand:
        held_card = catalog.cards.get(held_card_id)
        if not held_card or held_card.kind != "action" or not held_card.play:
            continue
        if held_card.play.effect != "modifier" or held_card.play.params.get("applies_to") != "rent":
            continue
        modifier_ids.append(held_card_id)

    return (modifier_ids[0] if modifier_ids else None, len(modifier_ids))


def _get_rent_color_options(player: PlayerState, catalog: CardCatalog, card_id: str) -> List[ChoiceOptionView]:
    card = catalog.cards[card_id]
    owned_colors = [
        color
        for color, property_cards in player.properties.items()
        if len(property_cards) > 0
    ]
    if card.kind == "rent":
        valid_colors = owned_colors if "any" in (card.colors or []) else [
            color for color in (card.colors or []) if color in owned_colors
        ]
        return [_build_choice_option(color, label=_format_color_label(color)) for color in valid_colors]

    if card.play and card.play.effect == "building":
        disallowed = set(card.play.params.get("disallowed_groups", []))
        valid_colors: List[str] = []
        for color in owned_colors:
          if color in disallowed:
              continue
          needed = _get_set_size(catalog, color)
          if len(player.properties.get(color, [])) < needed:
              continue
          if card.play.params.get("requires_house") and "action_house" not in player.buildings.get(color, []):
              continue
          valid_colors.append(color)
        return [_build_choice_option(color, label=_format_color_label(color)) for color in valid_colors]

    return []


def _stealable_card_options_for_target(
    *,
    actor: PlayerState,
    target: PlayerState,
    catalog: CardCatalog,
    allow_from_full_set: bool,
) -> Dict[str, List[ChoiceOptionView]]:
    options_by_target: Dict[str, List[ChoiceOptionView]] = {}
    stealable_cards: List[ChoiceOptionView] = []
    for color, card_ids in target.properties.items():
        set_size = _get_set_size(catalog, color)
        if not allow_from_full_set and set_size > 0 and len(card_ids) >= set_size:
            continue
        for card_id in card_ids:
            card = catalog.cards.get(card_id)
            if not card:
                continue
            stealable_cards.append(
                _build_choice_option(
                    card_id,
                    label=f"{_format_color_label(color)}: {card.name}",
                    detail=_format_money(card.money_value),
                )
            )
    options_by_target[target.id] = stealable_cards
    return options_by_target


def _stealable_full_sets_for_target(target: PlayerState, catalog: CardCatalog) -> Dict[str, List[ChoiceOptionView]]:
    options: List[ChoiceOptionView] = []
    for color, card_ids in target.properties.items():
        set_size = _get_set_size(catalog, color)
        if set_size > 0 and len(card_ids) >= set_size:
            options.append(
                _build_choice_option(
                    color,
                    label=_format_color_label(color),
                    detail=f"{len(card_ids)}/{set_size}",
                )
            )
    return {target.id: options}


def _give_card_options(actor: PlayerState, catalog: CardCatalog, allow_from_full_set: bool) -> List[ChoiceOptionView]:
    options: List[ChoiceOptionView] = []
    for color, card_ids in actor.properties.items():
        set_size = _get_set_size(catalog, color)
        if not allow_from_full_set and set_size > 0 and len(card_ids) >= set_size:
            continue
        for card_id in card_ids:
            card = catalog.cards.get(card_id)
            if not card:
                continue
            options.append(
                _build_choice_option(
                    card_id,
                    label=f"{_format_color_label(color)}: {card.name}",
                    detail=_format_money(card.money_value),
                )
            )
    return options


def _build_hand_action_view(
    *,
    state: GameState,
    player_id: str,
    card_id: str,
    catalog: CardCatalog,
) -> HandActionView:
    actor = state.players[player_id]
    card = catalog.cards[card_id]
    can_bank = (
        card.kind not in {"property", "property_wild"}
        and card.meta.get("bankable", True) is not False
        and card.money_value > 0
    )

    if card.kind == "money":
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_bank",
            can_bank=True,
        )

    if card.kind == "property":
        chosen_defaults = (
            {"property_color": card.colors[0]}
            if card.colors and len(card.colors) == 1
            else {}
        )
        fields = []
        if card.colors and len(card.colors) > 1:
            fields.append(
                FieldOptionsView(
                    field="property_color",
                    options=[
                        _build_choice_option(color, label=_format_color_label(color))
                        for color in card.colors
                    ],
                )
            )
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_property",
            can_bank=can_bank,
            required_fields=[] if chosen_defaults else ["property_color"],
            chosen_defaults=chosen_defaults,
            fields=fields,
        )

    if card.kind == "property_wild":
        colors = list(catalog.rent_table.keys()) if "any" in (card.colors or []) else list(card.colors or [])
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_property",
            can_bank=can_bank,
            required_fields=["property_color"],
            fields=[
                FieldOptionsView(
                    field="property_color",
                    options=[_build_choice_option(color, label=_format_color_label(color)) for color in colors],
                )
            ],
        )

    if card.kind == "rent":
        double_rent_card_id, double_rent_count = _get_available_double_rent_modifier(actor, catalog)
        target_options = [
            _build_choice_option(other_id, label=other_id)
            for other_id in state.players.keys()
            if other_id != player_id
        ]
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_counterable",
            can_bank=can_bank,
            available_double_rent_count=double_rent_count,
            available_double_rent_card_id=double_rent_card_id,
            required_fields=["target_player_id", "rent_color"],
            fields=[
                FieldOptionsView(field="target_player_id", options=target_options),
                FieldOptionsView(field="rent_color", options=_get_rent_color_options(actor, catalog, card_id)),
            ],
        )

    effect = card.play.effect if card.play else None
    if effect == "draw_cards":
        return HandActionView(card_id=card_id, card_kind=card.kind, action_type="play_action_non_counterable", can_bank=can_bank)

    if effect == "building":
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_non_counterable",
            can_bank=can_bank,
            required_fields=["rent_color"],
            fields=[FieldOptionsView(field="rent_color", options=_get_rent_color_options(actor, catalog, card_id))],
        )

    if effect == "charge_players":
        return HandActionView(card_id=card_id, card_kind=card.kind, action_type="play_action_counterable", can_bank=can_bank)

    if effect == "charge_player":
        target_options = [
            _build_choice_option(other_id, label=other_id)
            for other_id in state.players.keys()
            if other_id != player_id
        ]
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_counterable",
            can_bank=can_bank,
            required_fields=["target_player_id"],
            fields=[FieldOptionsView(field="target_player_id", options=target_options)],
        )

    if effect == "steal_full_set":
        target_options: List[ChoiceOptionView] = []
        steal_color_options_by_target: Dict[str, List[ChoiceOptionView]] = {}
        for other_id, target in state.players.items():
            if other_id == player_id:
                continue
            options = _stealable_full_sets_for_target(target, catalog).get(other_id, [])
            if not options:
                continue
            target_options.append(_build_choice_option(other_id, label=other_id))
            steal_color_options_by_target[other_id] = options
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_counterable",
            can_bank=can_bank,
            required_fields=["target_player_id", "steal_color"],
            fields=[
                FieldOptionsView(field="target_player_id", options=target_options),
                FieldOptionsView(field="steal_color", by_target=steal_color_options_by_target),
            ],
        )

    if effect == "steal_property":
        allow_from_full_set = bool(card.play.params.get("from_full_set_allowed", False)) if card.play else False
        target_options: List[ChoiceOptionView] = []
        steal_card_options_by_target: Dict[str, List[ChoiceOptionView]] = {}
        for other_id, target in state.players.items():
            if other_id == player_id:
                continue
            options = _stealable_card_options_for_target(
                actor=actor,
                target=target,
                catalog=catalog,
                allow_from_full_set=allow_from_full_set,
            ).get(other_id, [])
            if not options:
                continue
            target_options.append(_build_choice_option(other_id, label=other_id))
            steal_card_options_by_target[other_id] = options
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_counterable",
            can_bank=can_bank,
            required_fields=["target_player_id", "steal_card_id"],
            fields=[
                FieldOptionsView(field="target_player_id", options=target_options),
                FieldOptionsView(field="steal_card_id", by_target=steal_card_options_by_target),
            ],
        )

    if effect == "swap_property":
        allow_from_full_set = bool(card.play.params.get("from_full_set_allowed", False)) if card.play else False
        target_options: List[ChoiceOptionView] = []
        steal_card_options_by_target: Dict[str, List[ChoiceOptionView]] = {}
        for other_id, target in state.players.items():
            if other_id == player_id:
                continue
            options = _stealable_card_options_for_target(
                actor=actor,
                target=target,
                catalog=catalog,
                allow_from_full_set=allow_from_full_set,
            ).get(other_id, [])
            if not options:
                continue
            target_options.append(_build_choice_option(other_id, label=other_id))
            steal_card_options_by_target[other_id] = options
        return HandActionView(
            card_id=card_id,
            card_kind=card.kind,
            action_type="play_action_counterable",
            can_bank=can_bank,
            required_fields=["target_player_id", "steal_card_id", "give_card_id"],
            fields=[
                FieldOptionsView(field="target_player_id", options=target_options),
                FieldOptionsView(field="steal_card_id", by_target=steal_card_options_by_target),
                FieldOptionsView(field="give_card_id", options=_give_card_options(actor, catalog, allow_from_full_set)),
            ],
        )

    return HandActionView(
        card_id=card_id,
        card_kind=card.kind,
        action_type="play_bank",
        can_bank=can_bank,
    )


def _build_available_actions(state: GameState, player_id: str, catalog: CardCatalog) -> Dict[str, HandActionView]:
    player = state.players[player_id]
    missing_cards = [card_id for card_id in player.hand if card_id not in catalog.cards]
    if missing_cards:
        raise ValueError(f"Player hand contains cards not in catalog: {missing_cards}. Catalog has: {list(catalog.cards.keys())[:10]}...")
    return {
        card_id: _build_hand_action_view(state=state, player_id=player_id, card_id=card_id, catalog=catalog)
        for card_id in player.hand
    }


def build_player_view(
    state: GameState,
    player_id: str,
    catalog: Optional[CardCatalog] = None,
) -> PlayerView:
    if player_id not in state.players:
        raise ValueError("Player not found")

    catalog = catalog or _default_catalog()
    game_id = state.id
    current_player_state = state.players[player_id]
    private_payload = current_player_state.model_dump()
    private_payload["property_summaries"] = _build_property_summaries(current_player_state, catalog)
    private_payload["available_actions"] = _build_available_actions(state, player_id, catalog)
    player_private_view = PlayerPrivateView(**private_payload)

    others = []
    for pid, other_player_state in state.players.items():
        if pid == player_id:
            continue
        public_payload = other_player_state.model_dump()
        public_payload["hand_count"] = len(other_player_state.hand)
        public_payload["property_summaries"] = _build_property_summaries(other_player_state, catalog)
        player_public_view = PlayerPublicView(**public_payload)
        others.append(player_public_view)

    pending_prompts: List[PendingActionPrompt] = []
    host_id = resolve_host_id(state)
    for pending_id, pending in state.pending_actions.items():
        if pending.get("awaiting_player") != player_id:
            continue
        prompt = (
            "Accept or Just Say No?"
            if int(pending.get("jsn_count") or 0) == 0
            else "Opponent played Just Say No. Counter?"
        )
        pending_prompts.append(
            PendingActionPrompt(
                pending_id=pending_id,
                source_player=str(pending.get("source_player") or ""),
                card_id=str(pending.get("card_id") or ""),
                prompt=prompt,
                payload=dict(pending.get("payload") or {}),
            )
        )

    turn_actions = [
        TurnActionView.model_validate(a.model_dump() if hasattr(a, "model_dump") else a)
        for a in (state.turn_actions or [])
    ]
    payment_trackers = []
    for tracker in (state.payment_trackers or []):
        tracker_payload = tracker.model_dump() if hasattr(tracker, "model_dump") else tracker
        if not tracker_payload.get("participants"):
            continue
        payment_trackers.append(PaymentTrackerView.model_validate(tracker_payload))

    return PlayerView(
        game_id=game_id,
        game_code=state.game_code,
        host_id=host_id,
        started=bool(
            state.deck.draw_pile
            or state.deck.discard_pile
            or any(player.hand for player in state.players.values())
        ),
        you=player_private_view,
        others=others,
        pending_prompts=pending_prompts,
        turn_actions=turn_actions,
        payment_trackers=payment_trackers,
        deck_count=len(state.deck.draw_pile),
        discard_pile=state.deck.discard_pile,
        current_player_id=state.current_player_id,
        turn_number=state.turn_number,
        actions_taken=state.actions_taken,
        game_over=({"winner_id": state.winner_id} if state.winner_id else None),
    )
