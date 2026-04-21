import type {
  BoardHandCardRef,
  BoardMoneyCardRef,
  BoardPropertyCardRef,
} from "../../../components/cards/renderRefs";

export type TableauColor =
  | "brown"
  | "light-blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "blue"
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
  cards: LocalPropertyCard[];
  buildings?: Array<"House" | "Hotel">;
};

export type LocalBankCard = BoardMoneyCardRef;

export type LocalHandCard = BoardHandCardRef;

export type LocalPlayerState = {
  name: string;
  isCurrentTurn: boolean;
  handCount: number;
  bankTotal: string;
  handCards: LocalHandCard[];
  propertySets: LocalPropertySet[];
  bankCards: LocalBankCard[];
};
