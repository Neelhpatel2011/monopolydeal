import type {
  BoardHandCardRef,
  BoardMoneyCardRef,
  BoardPropertyCardRef,
} from "../../../components/cards/renderRefs";

export type TableauColor =
  | "brown"
  | "light-blue"
  | "railroad"
  | "utility"
  | "green"
  | "yellow"
  | "pink"
  | "orange"
  | "dark-blue"
  | "red"
  | "wild";

export type LocalPropertyCard = BoardPropertyCardRef;

export type LocalPropertySet = {
  id: string;
  name: string;
  color: TableauColor;
  count: number;
  targetSize: number;
  isComplete?: boolean;
  currentRentAmount?: number | null;
  buildingBonusAmount?: number;
  wildCount?: number;
  cards: LocalPropertyCard[];
  buildings?: Array<"House" | "Hotel">;
  wildReassignments?: Array<{
    cardId: string;
    availableColors: string[];
  }>;
  backendColor: string;
};

export type LocalBankCard = BoardMoneyCardRef;

export type LocalHandCard = BoardHandCardRef;

export type LocalPlayerState = {
  id: string;
  name: string;
  isCurrentTurn: boolean;
  handCount: number;
  bankTotal: string;
  handCards: LocalHandCard[];
  propertySets: LocalPropertySet[];
  bankCards: LocalBankCard[];
};
