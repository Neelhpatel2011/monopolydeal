export type Card = {
    id: string;
    name: string;
    category: CardCategory;
    bankValue: number;
    copies: number;
    description?: string;
    description2?: string;
    effect?: Effect[];
    color: string;
    lighterColor?: string;
}

export type CardCategory = "property" | "action" | "money";

export type PropertyCard = Card & {
    propertyGroup: PropertyGroup;
    setSize: number;
    rentByCount: number[];
}

export type PropertyGroup = "yellow"
  | "red"
  | "blue"
  | "green"
  | "orange"
  | "brown"
  | "railroad"

export type Effect =
  | {
      type: "drawCards";
      value: number; // amount to draw
    }
  | {
      type: "chargePlayer";
      target: "one_player";
      value: number; // amount to charge
    }
  | {
      type: "chargePlayers";
      target: "all_others";
      value: number; // amount to charge each
    }
  | {
      type: "stealFullSet";
      target: "opponent";
      includesBuildings: boolean;
    }
  | {
      type: "stealProperty";
      target: "opponent";
      value: number; // number of properties
    }
  | {
      type: "swapProperty";
      target: "opponent";
      value: number; // number of properties
    }
  | {
      type: "building";
      building: "house" | "hotel";
      rentBonus: number;
      requiresFullSet: boolean;
      requiresHouse?: boolean;
    }
  | {
      type: "counterAction";
    }
  | {
      type: "modifier";
      target: "rent";
      value: number; // multiplier
    };