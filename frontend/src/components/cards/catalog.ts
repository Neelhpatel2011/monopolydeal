import type {
  CardType,
  MonopolyDealCardByType,
  MonopolyDealCardColor,
  MonopolyDealCardData,
} from "../../types/monopolyDeal";

const validTypes = new Set<CardType>(["action", "rent", "property", "money", "wild"]);
const validColors = new Set<MonopolyDealCardColor>([
  "any",
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
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isColorArray(value: unknown): value is MonopolyDealCardColor[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && validColors.has(item as MonopolyDealCardColor));
}

function isBaseCardShape(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    validTypes.has(value.type as CardType) &&
    typeof value.label === "string" &&
    typeof value.name === "string" &&
    typeof value.value === "string"
  );
}

function isCardOfType<TType extends CardType>(
  value: unknown,
  type: TType,
): value is MonopolyDealCardByType<TType> {
  if (!isBaseCardShape(value) || value.type !== type) {
    return false;
  }

  if (type === "rent") {
    return isColorArray(value.rentColors);
  }

  if (type === "property") {
    return (
      isColorArray(value.colors) &&
      typeof value.setSize === "number" &&
      Array.isArray(value.rents) &&
      value.rents.every((rent) => typeof rent === "number")
    );
  }

  if (type === "wild") {
    return isColorArray(value.colors);
  }

  return true;
}

export function parseMonopolyDealCatalog(value: unknown): MonopolyDealCardData[] {
  if (!Array.isArray(value)) {
    throw new Error("Monopoly Deal catalog must be an array.");
  }

  const parsed = value.filter((entry): entry is MonopolyDealCardData => {
    if (!isBaseCardShape(entry)) {
      return false;
    }

    switch (entry.type) {
      case "rent":
        return isCardOfType(entry, "rent");
      case "property":
        return isCardOfType(entry, "property");
      case "wild":
        return isCardOfType(entry, "wild");
      case "money":
        return isCardOfType(entry, "money");
      case "action":
        return isCardOfType(entry, "action");
      default:
        return false;
    }
  });

  if (parsed.length !== value.length) {
    throw new Error("Monopoly Deal catalog contains invalid card entries.");
  }

  return parsed;
}

export function groupCardsByType(cards: MonopolyDealCardData[], orderedSections: CardType[]) {
  return orderedSections.map((type) => ({
    type,
    cards: cards.filter((card) => card.type === type),
  }));
}
