import { getPropertySetRenderCards } from "../../../components/cards/boardCardAdapters";
import { formatMoney } from "../../../components/cards/cardUtils";
import type { MonopolyDealCardByType, MonopolyDealCardData } from "../../../types/monopolyDeal";
import type { LocalPropertySet } from "../../board/model/localPlayer";
import type { OpponentPropertySet } from "../../opponents/model/opponentExpansion";

const BUILDING_RENT_BONUS: Record<"House" | "Hotel", number> = {
  House: 3,
  Hotel: 4,
};

export type PropertySetRentStep = {
  count: number;
  label: string;
  amountLabel: string;
  isCurrent: boolean;
};

export type PropertySetSummaryData = {
  count: number;
  targetSize: number;
  isComplete: boolean;
  renderCards: MonopolyDealCardData[];
  basePropertyCard: MonopolyDealCardByType<"property"> | null;
  currentRentLabel: string;
  currentRentAmount: number | null;
  wildCount: number;
  buildingKinds: Array<"House" | "Hotel">;
  buildingBonusAmount: number;
  rentSteps: PropertySetRentStep[];
  cardValueLabels: string[];
};

type PropertySetLike = LocalPropertySet | OpponentPropertySet;

function isPropertyCard(card: MonopolyDealCardData): card is MonopolyDealCardByType<"property"> {
  return card.type === "property";
}

export function getPropertySetSummaryData(set: PropertySetLike): PropertySetSummaryData {
  const renderCards = getPropertySetRenderCards(set);
  const count = "count" in set ? set.count ?? set.cards.length : set.cards.length;
  const targetSize = set.targetSize;
  const isComplete = count >= targetSize;
  const basePropertyCard = renderCards.find(isPropertyCard) ?? null;
  const wildCount = renderCards.filter((card) => card.type === "wild").length;
  const buildingKinds = set.buildings ?? [];
  const buildingBonusAmount = buildingKinds.reduce(
    (total, building) => total + BUILDING_RENT_BONUS[building],
    0,
  );
  const currentRentIndex = Math.max(0, Math.min(count, basePropertyCard?.rents.length ?? 0) - 1);
  const baseRent = basePropertyCard?.rents[currentRentIndex] ?? null;
  const currentRentAmount = baseRent == null ? null : baseRent + buildingBonusAmount;
  const rentSteps =
    basePropertyCard?.rents.map((amount, index) => {
      const stepCount = index + 1;
      const isFull = stepCount === targetSize;
      const totalAmount = amount + (isFull ? buildingBonusAmount : 0);

      return {
        count: stepCount,
        label: isFull ? "Full Set" : `${stepCount}`,
        amountLabel: formatMoney(totalAmount),
        isCurrent: stepCount === Math.min(count, targetSize),
      };
    }) ?? [];

  const cardValueLabels = renderCards.map((card) => `${card.name} ${card.value}`);

  return {
    count,
    targetSize,
    isComplete,
    renderCards,
    basePropertyCard,
    currentRentLabel: currentRentAmount == null ? "-" : formatMoney(currentRentAmount),
    currentRentAmount,
    wildCount,
    buildingKinds,
    buildingBonusAmount,
    rentSteps,
    cardValueLabels,
  };
}
