import type { MonopolyDealCardSize } from "../../types/monopolyDeal";

export type BoardCardSurfacePreset = {
  size: MonopolyDealCardSize;
  scale: number;
  renderMode: "full" | "micro";
};

export type BoardCardSurfaceName =
  | "hand"
  | "tableau"
  | "bank"
  | "opponent-property"
  | "opponent-money";

export const boardCardSurfacePresets: Record<BoardCardSurfaceName, BoardCardSurfacePreset> = {
  hand: {
    size: "sm",
    scale: 0.49,
    renderMode: "full",
  },
  tableau: {
    size: "sm",
    scale: 0.37,
    renderMode: "full",
  },
  bank: {
    size: "sm",
    scale: 0.34,
    renderMode: "micro",
  },
  "opponent-property": {
    size: "sm",
    scale: 0.36,
    renderMode: "full",
  },
  "opponent-money": {
    size: "sm",
    scale: 0.34,
    renderMode: "micro",
  },
};
