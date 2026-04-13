export type OpponentPropertyColor =
  | "brown"
  | "light-blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "blue"
  | "red";

export type OpponentPropertyProgress = {
  id: string;
  color: OpponentPropertyColor;
  count: number;
  targetSize: number;
  isComplete?: boolean;
};

export type OpponentPropertyCard = {
  id: string;
  kind: "property" | "wild";
};

export type OpponentPropertySet = {
  id: string;
  name: string;
  color: OpponentPropertyColor;
  targetSize: number;
  cards: OpponentPropertyCard[];
  buildings?: Array<"House" | "Hotel">;
};

export type OpponentMoneyCard = {
  id: string;
  label: string;
  amount: string;
  tone: "paper" | "sand" | "sky" | "sage";
};

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
  };
}
