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
    scale: 0.44,
    renderMode: "full",
  },
  tableau: {
    size: "md",
    scale: 0.42,
    renderMode: "full",
  },
  bank: {
    size: "sm",
    scale: 0.24,
    renderMode: "full",
  },
  "opponent-property": {
    size: "md",
    scale: 0.32,
    renderMode: "full",
  },
  "opponent-money": {
    size: "sm",
    scale: 0.28,
    renderMode: "full",
  },
};
