import rawCatalog from "../../data/backendCardCatalog.generated.json";
import type { ActionFieldKey, ActionFieldValue, DraftActionIntent } from "../../features/board/model/interaction-types";
import type { BoardHandCardRef, BoardMoneyCardRef, BoardPropertyCardRef } from "../../components/cards/renderRefs";
import type { MonopolyDealCardColor } from "../../types/monopolyDeal";
import type { BackendHandActionView } from "./contracts";

type BackendCardEffect = {
  type: string;
  [key: string]: unknown;
};

type BackendCardCatalogEntry = {
  id: string;
  name: string;
  type: "money" | "property" | "property_wild" | "rent" | "action";
  count: number;
  bank_value: number;
  colors?: string[];
  property_group?: string | null;
  effect?: BackendCardEffect;
  rent_by_count?: number[];
  bankable?: boolean;
  restrictions?: Record<string, unknown>;
  note?: string | null;
};

export type BackendCardKind = BackendCardCatalogEntry["type"];

export type BackendCardMeta = {
  backendCardId: string;
  name: string;
  kind: BackendCardKind;
  moneyValue: number;
  colors: string[];
  propertyGroup: string | null;
  rentByCount: number[];
  bankable: boolean;
  effectType: string | null;
  effectParams: Record<string, unknown>;
  frontendCatalogCardId: string;
};

export type BackendHandIntentProfile = {
  actionType: DraftActionIntent["actionType"];
  category: "money" | "property" | "wild" | "rent" | "action";
  chosen: Partial<Record<ActionFieldKey, ActionFieldValue>>;
  missing: ActionFieldKey[];
  canBank: boolean;
};

const rawEntries = rawCatalog as BackendCardCatalogEntry[];

function normalizeColor(color: string): string {
  return color.trim().toLowerCase();
}

function normalizeFrontendCardColor(color: string): MonopolyDealCardColor {
  switch (normalizeColor(color)) {
    case "light_blue":
      return "light_blue";
    case "dark_blue":
      return "dark_blue";
    case "brown":
    case "pink":
    case "orange":
    case "red":
    case "yellow":
    case "green":
    case "railroad":
    case "utility":
    case "any":
      return normalizeColor(color) as MonopolyDealCardColor;
    default:
      throw new Error(`Unsupported backend color: ${color}`);
  }
}

function getFrontendCatalogCardId(entry: BackendCardCatalogEntry): string {
  if (entry.type === "money") {
    return `money-${entry.bank_value}`;
  }

  if (entry.type === "property") {
    switch (normalizeColor(entry.property_group ?? "")) {
      case "brown":
        return "property-brown";
      case "light_blue":
        return "property-light-blue";
      case "pink":
        return "property-pink";
      case "orange":
        return "property-orange";
      case "red":
        return "property-red";
      case "yellow":
        return "property-yellow";
      case "green":
        return "property-green";
      case "dark_blue":
        return "property-dark-blue";
      case "railroad":
        return "property-railroad";
      case "utility":
        return "property-utility";
      default:
        throw new Error(`Unsupported property group: ${entry.property_group}`);
    }
  }

  if (entry.type === "property_wild") {
    const normalizedColors = (entry.colors ?? []).map(normalizeColor).sort();
    const colors = normalizedColors.join("|");
    const allPropertyColors = [
      "brown",
      "dark_blue",
      "green",
      "light_blue",
      "orange",
      "pink",
      "railroad",
      "red",
      "utility",
      "yellow",
    ];
    if (
      colors === "any" ||
      allPropertyColors.every((color) => normalizedColors.includes(color))
    ) {
      return "wild-any";
    }

    switch (colors) {
      case "brown|light_blue":
        return "wild-brown-lightblue";
      case "orange|pink":
        return "wild-pink-orange";
      case "red|yellow":
        return "wild-red-yellow";
      case "dark_blue|green":
        return "wild-green-darkblue";
      case "green|railroad":
        return "wild-railroad-green";
      case "light_blue|railroad":
        return "wild-railroad-lightblue";
      case "railroad|utility":
        return "wild-railroad-utility";
      default:
        throw new Error(`Unsupported property wild colors: ${colors}`);
    }
  }

  if (entry.type === "rent") {
    const colors = (entry.colors ?? []).map(normalizeColor).sort().join("|");
    switch (colors) {
      case "any":
        return "rent-wild";
      case "dark_blue|green":
        return "rent-green-blue";
      case "brown|light_blue":
        return "rent-brown-lightblue";
      case "orange|pink":
        return "rent-pink-orange";
      case "red|yellow":
        return "rent-red-yellow";
      case "railroad|utility":
        return "rent-railroad-utility";
      default:
        throw new Error(`Unsupported rent colors: ${colors}`);
    }
  }

  switch (entry.id) {
    case "action_pass_go":
      return "action-pass-go";
    case "action_debt_collector":
      return "action-debt-collector";
    case "action_birthday":
    case "action_its_my_birthday":
      return "action-birthday";
    case "action_deal_breaker":
      return "action-deal-breaker";
    case "action_sly_deal":
      return "action-sly-deal";
    case "action_forced_deal":
      return "action-forced-deal";
    case "action_just_say_no":
      return "action-just-say-no";
    case "action_house":
      return "action-house";
    case "action_hotel":
      return "action-hotel";
    case "action_double_the_rent":
      return "action-double-the-rent";
    default:
      throw new Error(`Unsupported action card: ${entry.id}`);
  }
}

const backendCardCatalog = new Map<string, BackendCardMeta>(
  rawEntries.map((entry) => [
    entry.id,
    {
      backendCardId: entry.id,
      name: entry.name,
      kind: entry.type,
      moneyValue: entry.bank_value,
      colors: (entry.colors ?? []).map(normalizeColor),
      propertyGroup: entry.property_group ? normalizeColor(entry.property_group) : null,
      rentByCount: entry.rent_by_count ?? [],
      bankable: entry.bankable ?? true,
      effectType: entry.effect?.type ?? null,
      effectParams: entry.effect
        ? Object.fromEntries(Object.entries(entry.effect).filter(([key]) => key !== "type"))
        : {},
      frontendCatalogCardId: getFrontendCatalogCardId(entry),
    },
  ]),
);

export function getBackendCardMeta(cardId: string): BackendCardMeta {
  const meta = backendCardCatalog.get(cardId);
  if (!meta) {
    throw new Error(`Missing backend card metadata for ${cardId}`);
  }
  return meta;
}

export function formatBankValue(value: number): string {
  return `$${value}M`;
}

export function formatColorLabel(color: string): string {
  switch (normalizeColor(color)) {
    case "light_blue":
      return "Light Blue";
    case "dark_blue":
      return "Dark Blue";
    default:
      return normalizeColor(color)
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function toTableauColor(color: string) {
  switch (normalizeColor(color)) {
    case "light_blue":
      return "light-blue" as const;
    case "dark_blue":
      return "blue" as const;
    case "brown":
    case "green":
    case "yellow":
    case "purple":
    case "orange":
    case "red":
      return normalizeColor(color) as
        | "brown"
        | "green"
        | "yellow"
        | "purple"
        | "orange"
        | "red";
    default:
      return "wild" as const;
  }
}

export function getFrontendCatalogIdForBackendCard(cardId: string) {
  return getBackendCardMeta(cardId).frontendCatalogCardId;
}

export function buildHandCardRef(
  cardId: string,
  index: number,
  actionOptions?: BackendHandActionView,
): BoardHandCardRef {
  const meta = getBackendCardMeta(cardId);
  return {
    id: `hand:${index}:${cardId}`,
    backendCardId: cardId,
    catalogCardId: meta.frontendCatalogCardId,
    label: meta.name,
    actionOptions: actionOptions
      ? {
          actionType: actionOptions.action_type,
          cardKind: actionOptions.card_kind,
          canBank: actionOptions.can_bank,
          requiredFields: actionOptions.required_fields,
          chosenDefaults: actionOptions.chosen_defaults,
          fieldOptions: actionOptions.fields.map((field) => ({
            field: field.field,
            options: field.options,
            byTarget: field.by_target,
          })),
        }
      : undefined,
  };
}

export function buildBankCardRef(cardId: string, index: number): BoardMoneyCardRef {
  const meta = getBackendCardMeta(cardId);
  return {
    id: `bank:${index}:${cardId}`,
    backendCardId: cardId,
    catalogCardId: meta.frontendCatalogCardId,
    label: meta.kind === "rent" ? "Rent" : "Money",
    amount: String(meta.moneyValue),
    tone: meta.kind === "rent" ? "sky" : "sage",
  };
}

export function buildPropertyCardRef(cardId: string, index: number): BoardPropertyCardRef {
  const meta = getBackendCardMeta(cardId);
  return {
    id: `property:${index}:${cardId}`,
    backendCardId: cardId,
    catalogCardId: meta.frontendCatalogCardId,
    kind: meta.kind === "property_wild" ? "wild" : "property",
  };
}

export function getPropertySetTargetSize(color: string): number {
  const propertyCard = Array.from(backendCardCatalog.values()).find(
    (card) => card.kind === "property" && card.propertyGroup === normalizeColor(color),
  );
  return propertyCard?.rentByCount.length ?? 0;
}

export function getBuildingBonus(buildingCardId: string): number {
  const meta = getBackendCardMeta(buildingCardId);
  return Number(meta.effectParams.rent_bonus ?? 0);
}

export function createBackendHandIntentProfile(cardId: string): BackendHandIntentProfile {
  const meta = getBackendCardMeta(cardId);

  if (meta.kind === "money") {
    return {
      actionType: "play_bank",
      category: "money",
      chosen: {},
      missing: [],
      canBank: true,
    };
  }

  if (meta.kind === "property") {
    const propertyColor = meta.propertyGroup;
    return {
      actionType: "play_property",
      category: "property",
      chosen: propertyColor ? { property_color: propertyColor } : {},
      missing: propertyColor ? [] : ["property_color"],
      canBank: meta.bankable,
    };
  }

  if (meta.kind === "property_wild") {
    return {
      actionType: "play_property",
      category: "wild",
      chosen: {},
      missing: ["property_color"],
      canBank: meta.bankable,
    };
  }

  if (meta.kind === "rent") {
    return {
      actionType: "play_action_counterable",
      category: "rent",
      chosen: {},
      missing: ["target_player_id", "rent_color"],
      canBank: meta.bankable,
    };
  }

  switch (meta.effectType) {
    case "draw_cards":
      return {
        actionType: "play_action_non_counterable",
        category: "action",
        chosen: {},
        missing: [],
        canBank: meta.bankable,
      };
    case "building":
      return {
        actionType: "play_action_non_counterable",
        category: "action",
        chosen: {},
        missing: ["rent_color"],
        canBank: meta.bankable,
      };
    case "charge_players":
      return {
        actionType: "play_action_counterable",
        category: "action",
        chosen: {},
        missing: [],
        canBank: meta.bankable,
      };
    case "charge_player":
      return {
        actionType: "play_action_counterable",
        category: "action",
        chosen: {},
        missing: ["target_player_id"],
        canBank: meta.bankable,
      };
    case "steal_full_set":
      return {
        actionType: "play_action_counterable",
        category: "action",
        chosen: {},
        missing: ["target_player_id", "steal_color"],
        canBank: meta.bankable,
      };
    case "steal_property":
      return {
        actionType: "play_action_counterable",
        category: "action",
        chosen: {},
        missing: ["target_player_id", "steal_card_id"],
        canBank: meta.bankable,
      };
    case "swap_property":
      return {
        actionType: "play_action_counterable",
        category: "action",
        chosen: {},
        missing: ["target_player_id", "steal_card_id", "give_card_id"],
        canBank: meta.bankable,
      };
    case "modifier":
    case "counter_action":
      return {
        actionType: "play_bank",
        category: "action",
        chosen: {},
        missing: [],
        canBank: meta.bankable,
      };
    default:
      return {
        actionType: "play_bank",
        category: "action",
        chosen: {},
        missing: [],
        canBank: meta.bankable,
      };
  }
}

export function createDraftActionIntentForBackendCard(
  uiCardId: string,
  backendCardId: string,
): DraftActionIntent {
  const profile = createBackendHandIntentProfile(backendCardId);
  return {
    cardId: uiCardId,
    actionType: profile.actionType,
    chosen: profile.chosen,
    missing: profile.missing,
  };
}

export function getRentColorOptionsForCard(cardId: string, ownedColors: string[]): string[] {
  const meta = getBackendCardMeta(cardId);
  if (meta.kind === "rent") {
    if (meta.colors.includes("any")) {
      return ownedColors;
    }
    return meta.colors;
  }
  if (meta.effectType === "building") {
    return ownedColors;
  }
  return [];
}

export function getSupportedPropertyColorsForWild(cardId: string): string[] {
  const meta = getBackendCardMeta(cardId);
  if (meta.kind !== "property_wild") {
    return [];
  }
  if (meta.colors.includes("any")) {
    return [
      "brown",
      "light_blue",
      "pink",
      "orange",
      "red",
      "yellow",
      "green",
      "dark_blue",
      "railroad",
      "utility",
    ];
  }
  return meta.colors;
}

export function isCounterActionOnly(cardId: string): boolean {
  return getBackendCardMeta(cardId).effectType === "counter_action";
}

export function toFrontendCardColor(color: string): MonopolyDealCardColor {
  return normalizeFrontendCardColor(color);
}
