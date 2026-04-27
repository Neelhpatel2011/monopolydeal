import type { LocalHandCard } from "./localPlayer";
import type { ActionFieldKey, ActionFieldValue, DraftActionIntent } from "./interaction-types";
import type { BackendActionRequest } from "../../../integration/backend/contracts";

export type ComposerOption = {
  value: string;
  label: string;
  detail?: string;
};

export function applyChosenValue(
  intent: DraftActionIntent,
  field: ActionFieldKey,
  value: ActionFieldValue,
): DraftActionIntent {
  return {
    ...intent,
    chosen: {
      ...intent.chosen,
      [field]: value,
    },
    missing: intent.missing.filter((missingField) => missingField !== field),
  };
}

export function buildActionRequestFromIntent(args: {
  playerId: string;
  card: LocalHandCard;
  intent: DraftActionIntent;
}): BackendActionRequest {
  const { playerId, card, intent } = args;
  const base: BackendActionRequest = {
    action_type: intent.actionType as BackendActionRequest["action_type"],
    player_id: playerId,
  };

  switch (intent.actionType) {
    case "play_bank":
      return {
        ...base,
        bank_card_id: card.backendCardId,
      };
    case "play_property":
      return {
        ...base,
        property_card_id: card.backendCardId,
        property_color:
          typeof intent.chosen.property_color === "string"
            ? intent.chosen.property_color
            : undefined,
      };
    case "play_action_counterable":
    case "play_action_non_counterable":
      return {
        ...base,
        card_id: card.backendCardId,
        rent_color:
          typeof intent.chosen.rent_color === "string" ? intent.chosen.rent_color : undefined,
        target_player_id:
          typeof intent.chosen.target_player_id === "string"
            ? intent.chosen.target_player_id
            : undefined,
        steal_card_id:
          typeof intent.chosen.steal_card_id === "string"
            ? intent.chosen.steal_card_id
            : undefined,
        give_card_id:
          typeof intent.chosen.give_card_id === "string"
            ? intent.chosen.give_card_id
            : undefined,
        steal_color:
          typeof intent.chosen.steal_color === "string"
            ? intent.chosen.steal_color
            : undefined,
        discard_ids: Array.isArray(intent.chosen.discard_ids)
          ? intent.chosen.discard_ids
          : undefined,
        double_rent_ids: Array.isArray(intent.chosen.double_rent_ids)
          ? intent.chosen.double_rent_ids.filter(
              (value): value is string => typeof value === "string",
            )
          : undefined,
      };
    default:
      return base;
  }
}

export function buildChangeWildRequest(args: {
  playerId: string;
  cardId: string;
  newColor: string;
}): BackendActionRequest {
  const { playerId, cardId, newColor } = args;
  return {
    action_type: "change_wild",
    player_id: playerId,
    change_wild: {
      card_id: cardId,
      new_color: newColor,
    },
  };
}

export function getComposerOptions(args: {
  card: LocalHandCard;
  field: ActionFieldKey;
  chosen: Partial<Record<ActionFieldKey, ActionFieldValue>>;
}): ComposerOption[] {
  const { card, field, chosen } = args;
  const fieldOptions = card.actionOptions?.fieldOptions.find((option) => option.field === field);
  if (!fieldOptions) {
    return [];
  }
  const targetPlayerId = typeof chosen.target_player_id === "string" ? chosen.target_player_id : null;
  const options = targetPlayerId && Object.keys(fieldOptions.byTarget).length > 0
    ? fieldOptions.byTarget[targetPlayerId] ?? []
    : fieldOptions.options;

  return options.map((option) => ({
    value: option.value,
    label: option.label,
    detail: option.detail ?? undefined,
  }));
}

export function canDirectlyBankSelectedCard(card: LocalHandCard) {
  return card.actionOptions?.canBank ?? false;
}
