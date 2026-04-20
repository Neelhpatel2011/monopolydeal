import type { DraftActionIntent, ActionFieldKey, ActionFieldValue } from "./interaction-types";
import type { TableauColor } from "./localPlayer";

export type HandCardIntentProfile = {
  actionType: "playProperty" | "rent" | "dealBreaker" | "bankOnly";
  category: "property" | "wild" | "action";
  chosen: Partial<Record<ActionFieldKey, ActionFieldValue>>;
  missing: ActionFieldKey[];
  propertyColor: TableauColor | null;
  canBank: boolean;
};

const propertyColorByLabelPrefix: Array<[string, TableauColor]> = [
  ["Brown", "brown"],
  ["Light Blue", "light-blue"],
  ["Green", "green"],
  ["Yellow", "yellow"],
  ["Purple", "purple"],
  ["Orange", "orange"],
  ["Dark Blue", "blue"],
  ["Blue", "blue"],
  ["Red", "red"],
];

export function inferPropertyColor(label: string): TableauColor | null {
  for (const [prefix, color] of propertyColorByLabelPrefix) {
    if (label.startsWith(prefix)) {
      return color;
    }
  }

  return null;
}

export function deriveHandCardIntentProfile(label: string): HandCardIntentProfile {
  if (label === "Wild") {
    return {
      actionType: "playProperty",
      category: "wild",
      chosen: {},
      missing: ["property_color"],
      propertyColor: null,
      canBank: true,
    };
  }

  if (label.includes("Property")) {
    const propertyColor = inferPropertyColor(label);

    return {
      actionType: "playProperty",
      category: "property",
      chosen: propertyColor ? { property_color: propertyColor } : {},
      missing: propertyColor ? [] : ["property_color"],
      propertyColor,
      canBank: true,
    };
  }

  if (label === "Rent") {
    return {
      actionType: "rent",
      category: "action",
      chosen: {},
      missing: ["target_player_id", "rent_color"],
      propertyColor: null,
      canBank: true,
    };
  }

  if (label === "Deal Breaker") {
    return {
      actionType: "dealBreaker",
      category: "action",
      chosen: {},
      missing: ["target_player_id"],
      propertyColor: null,
      canBank: true,
    };
  }

  return {
    actionType: "bankOnly",
    category: "action",
    chosen: {},
    missing: [],
    propertyColor: null,
    canBank: true,
  };
}

export function createHandDraftActionIntent(cardId: string, label: string): DraftActionIntent {
  const profile = deriveHandCardIntentProfile(label);

  return {
    cardId,
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

  if (color === "blue") {
    return "Dark Blue";
  }

  return color.replace(/(^|-)([a-z])/g, (_, separator: string, letter: string) =>
    `${separator === "-" ? " " : ""}${letter.toUpperCase()}`,
  );
}
