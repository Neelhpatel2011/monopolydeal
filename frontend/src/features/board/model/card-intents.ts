import type { DraftActionIntent, ActionFieldKey, ActionFieldValue } from "./interaction-types";
import type { TableauColor } from "./localPlayer";
import { getBackendCardMeta, toTableauColor } from "../../../integration/backend/catalog";
import type { LocalHandCard } from "./localPlayer";

export type HandCardIntentProfile = {
  actionType: string;
  category: "money" | "property" | "wild" | "rent" | "action";
  chosen: Partial<Record<ActionFieldKey, ActionFieldValue>>;
  missing: ActionFieldKey[];
  propertyColor: TableauColor | null;
  canBank: boolean;
};

export function deriveHandCardIntentProfile(
  card: Pick<LocalHandCard, "backendCardId" | "label" | "actionOptions">,
): HandCardIntentProfile {
  const profile = card.actionOptions;
  if (!profile) {
    throw new Error(`Missing backend action options for card ${card.backendCardId}`);
  }
  const meta = getBackendCardMeta(card.backendCardId);
  const propertyColor = meta.propertyGroup ? (toTableauColor(meta.propertyGroup) as TableauColor) : null;
  return {
    actionType: profile.actionType,
    category:
      profile.cardKind === "money"
        ? "money"
        : profile.cardKind === "property"
          ? "property"
          : profile.cardKind === "property_wild"
            ? "wild"
            : profile.cardKind === "rent"
              ? "rent"
              : "action",
    chosen: profile.chosenDefaults,
    missing: profile.requiredFields as ActionFieldKey[],
    propertyColor,
    canBank: profile.canBank,
  };
}

export function createHandDraftActionIntent(
  card: Pick<LocalHandCard, "id" | "backendCardId" | "label" | "actionOptions">,
): DraftActionIntent {
  const profile = deriveHandCardIntentProfile(card);

  return {
    cardId: card.id,
    actionType: profile.actionType,
    chosen: profile.chosen,
    missing: profile.missing,
  };
}

export function formatActionFieldLabel(field: ActionFieldKey): string {
  switch (field) {
    case "property_color":
      return "property color";
    case "rent_color":
      return "rent color";
    case "target_player_id":
      return "target player";
    case "steal_card_id":
      return "card to steal";
    case "give_card_id":
      return "card to give";
    case "steal_color":
      return "set color";
    case "discard_ids":
      return "cards to discard";
    default:
      return field;
  }
}

export function formatTableauColor(color: string): string {
  if (color === "light-blue") {
    return "Light Blue";
  }

  if (color === "dark-blue") {
    return "Dark Blue";
  }

  return color.replace(/(^|-)([a-z])/g, (_, separator: string, letter: string) =>
    `${separator === "-" ? " " : ""}${letter.toUpperCase()}`,
  );
}
