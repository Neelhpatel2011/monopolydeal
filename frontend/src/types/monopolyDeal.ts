export type CardType = "action" | "rent" | "property" | "money" | "wild";

export type MonopolyDealIcon = "action" | "rent" | "property" | "money" | "wild";

export type MonopolyDealCardColor =
  | "any"
  | "brown"
  | "light_blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark_blue"
  | "railroad"
  | "utility";

export interface MonopolyDealCardBase {
  id: string;
  type: CardType;
  label: string;
  name: string;
  description?: string;
  value: string;

  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
  copies?: number;
  icon?: MonopolyDealIcon;
}

export interface ActionCardData extends MonopolyDealCardBase {
  type: "action";
}

export interface RentCardData extends MonopolyDealCardBase {
  type: "rent";
  rentColors: MonopolyDealCardColor[];
}

export interface PropertyCardData extends MonopolyDealCardBase {
  type: "property";
  colors: MonopolyDealCardColor[];
  setSize: number;
  rents: number[];
}

export interface MoneyCardData extends MonopolyDealCardBase {
  type: "money";
}

export interface WildCardData extends MonopolyDealCardBase {
  type: "wild";
  colors: MonopolyDealCardColor[];
}

export type MonopolyDealCardData =
  | ActionCardData
  | RentCardData
  | PropertyCardData
  | MoneyCardData
  | WildCardData;

export type MonopolyDealCardByType<TType extends CardType> = Extract<
  MonopolyDealCardData,
  { type: TType }
>;

export type MonopolyDealCardSize = "sm" | "md" | "lg";
