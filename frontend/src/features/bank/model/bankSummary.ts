import { getBankRenderCard } from "../../../components/cards/boardCardAdapters";
import type { BoardMoneyCardRef } from "../../../components/cards/renderRefs";
import type { MonopolyDealCardData } from "../../../types/monopolyDeal";
import { formatMoney } from "../../../components/cards/cardUtils";

export type BankSummaryData = {
  totalAmount: number;
  moneyCount: number;
  actionCount: number;
  cardValueLabels: string[];
  renderCards: MonopolyDealCardData[];
  breakdownRows: Array<{
    key: string;
    label: string;
    count: number;
    totalLabel: string;
  }>;
};

export function getBankSummaryData(cards: BoardMoneyCardRef[]): BankSummaryData {
  const renderCards = cards.map((card) => getBankRenderCard(card));
  const breakdownMap = new Map<
    string,
    {
      label: string;
      count: number;
      total: number;
    }
  >();

  cards.forEach((card, index) => {
    const renderCard = renderCards[index];
    const key = renderCard.id;
    const label =
      renderCard.type === "money"
        ? `${renderCard.value} bill`
        : `${renderCard.name} ${renderCard.value}`;
    const next = breakdownMap.get(key) ?? { label, count: 0, total: 0 };
    next.count += 1;
    next.total += Number(card.amount || 0);
    breakdownMap.set(key, next);
  });

  return {
    totalAmount: cards.reduce((total, card) => total + Number(card.amount || 0), 0),
    moneyCount: renderCards.filter((card) => card.type === "money").length,
    actionCount: renderCards.filter((card) => card.type !== "money").length,
    cardValueLabels: renderCards.map((card) => `${card.name} ${card.value}`),
    renderCards,
    breakdownRows: Array.from(breakdownMap.entries()).map(([key, row]) => ({
      key,
      label: row.label,
      count: row.count,
      totalLabel: formatMoney(row.total),
    })),
  };
}
