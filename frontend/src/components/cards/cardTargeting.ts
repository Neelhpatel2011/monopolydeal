import type { ActionCardData, RentCardData } from "../../types/monopolyDeal";

export type CardTargetBadge = {
  value: "1" | "ALL";
  description: string;
  sentence: string;
};

const singleTargetActionNames = new Set([
  "Deal Breaker",
  "Debt Collector",
  "Forced Deal",
  "Sly Deal",
]);

const allTargetActionNames = new Set(["It's My Birthday", "Its My Birthday"]);

const onePlayerTarget: CardTargetBadge = {
  value: "1",
  description: "Targets 1 player.",
  sentence: "Targets 1 player.",
};

const allPlayersTarget: CardTargetBadge = {
  value: "ALL",
  description: "Targets all players.",
  sentence: "Targets all players.",
};

export function getRentTargetBadge(card: RentCardData): CardTargetBadge {
  const isMulticolorRent = card.rentColors.includes("any");

  return isMulticolorRent ? onePlayerTarget : allPlayersTarget;
}

export function getActionTargetBadge(card: ActionCardData): CardTargetBadge | null {
  if (singleTargetActionNames.has(card.name)) {
    return onePlayerTarget;
  }

  if (allTargetActionNames.has(card.name)) {
    return allPlayersTarget;
  }

  return null;
}
