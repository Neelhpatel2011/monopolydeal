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
    size: "md",
    scale: 0.8,
    renderMode: "full",
  },
  tableau: {
    size: "md",
    scale: 0.42,
    renderMode: "full",
  },
  bank: {
    size: "sm",
    scale: 0.34,
    renderMode: "micro",
  },
  "opponent-property": {
    size: "md",
    scale: 0.32,
    renderMode: "full",
  },
  "opponent-money": {
    size: "sm",
    scale: 0.34,
    renderMode: "micro",
  },
};
