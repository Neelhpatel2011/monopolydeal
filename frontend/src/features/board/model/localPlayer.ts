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

export type LocalPropertyCard = {
  id: string;
  kind: "property" | "wild";
};

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

export type LocalBankCard = {
  id: string;
  label: string;
  amount: string;
  tone: "paper" | "sand" | "sky" | "sage";
};

export type LocalHandCard = {
  id: string;
  label: string;
};

export type LocalPlayerState = {
  name: string;
  isCurrentTurn: boolean;
  handCount: number;
  bankTotal: string;
  handCards: LocalHandCard[];
  propertySets: LocalPropertySet[];
  bankCards: LocalBankCard[];
};
