import type { ActionCardData, RentCardData } from "../../types/monopolyDeal";

export type CardTargetBadge = {
  label: "Target";
  value: "1" | "ALL";
  description: string;
};

const singleTargetActionNames = new Set([
  "Deal Breaker",
  "Debt Collector",
  "Forced Deal",
  "Sly Deal",
]);

const allTargetActionNames = new Set(["It's My Birthday", "Its My Birthday"]);

export function getRentTargetBadge(card: RentCardData): CardTargetBadge {
  const isMulticolorRent = card.rentColors.includes("any");

  return isMulticolorRent
    ? {
        label: "Target",
        value: "1",
        description: "Affects one opponent.",
      }
    : {
        label: "Target",
        value: "ALL",
        description: "Affects every opponent.",
      };
}

export function getActionTargetBadge(card: ActionCardData): CardTargetBadge | null {
  if (singleTargetActionNames.has(card.name)) {
    return {
      label: "Target",
      value: "1",
      description: "Affects one opponent.",
    };
  }

  if (allTargetActionNames.has(card.name)) {
    return {
      label: "Target",
      value: "ALL",
      description: "Affects every opponent.",
    };
  }

  return null;
}
