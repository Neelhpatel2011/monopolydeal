import type {
  BoardMoneyCardRef,
  BoardPropertyCardRef,
} from "../../../components/cards/renderRefs";

export type OpponentPropertyColor =
  | "brown"
  | "light-blue"
  | "railroad"
  | "utility"
  | "green"
  | "yellow"
  | "pink"
  | "orange"
  | "dark-blue"
  | "red";

export type OpponentPropertyProgress = {
  id: string;
  color: OpponentPropertyColor;
  count: number;
  targetSize: number;
  isComplete?: boolean;
};

export type OpponentPropertyCard = BoardPropertyCardRef;

export type OpponentPropertySet = {
  id: string;
  name: string;
  color: OpponentPropertyColor;
  targetSize: number;
  count?: number;
  isComplete?: boolean;
  currentRentAmount?: number | null;
  buildingBonusAmount?: number;
  wildCount?: number;
  cards: OpponentPropertyCard[];
  buildings?: Array<"House" | "Hotel">;
  wildReassignments?: Array<{
    cardId: string;
    availableColors: string[];
  }>;
  backendColor: string;
};

export type OpponentMoneyCard = BoardMoneyCardRef;

export type OpponentAvatarTone = "sky" | "rose" | "gold" | "sage";

export type OpponentSummary = {
  id: string;
  name: string;
  avatarInitial: string;
  avatarTone?: OpponentAvatarTone;
  handCount: number;
  bankTotal: string;
  properties: OpponentPropertyProgress[];
  isCurrentPlayer?: boolean;
  isWinner?: boolean;
};

export type OpponentDetail = OpponentSummary & {
  propertySets: OpponentPropertySet[];
  moneyCards: OpponentMoneyCard[];
};

export function toOpponentSummary(opponent: OpponentDetail): OpponentSummary {
  return {
    id: opponent.id,
    name: opponent.name,
    avatarInitial: opponent.avatarInitial,
    avatarTone: opponent.avatarTone,
    handCount: opponent.handCount,
    bankTotal: opponent.bankTotal,
    properties: opponent.properties,
    isCurrentPlayer: opponent.isCurrentPlayer,
    isWinner: opponent.isWinner,
  };
}
