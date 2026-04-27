import type {
  MonopolyDealCardColor,
  MonopolyDealCardData,
  MonopolyDealCardSize,
} from "../../types/monopolyDeal";

export type CardSizeTokens = {
  cardWidth: number;
  cardHeight: number;
};

export const cardSizeMap: Record<MonopolyDealCardSize, CardSizeTokens> = {
  xs: {
    cardWidth: 176,
    cardHeight: 281,
  },
  sm: {
    cardWidth: 194,
    cardHeight: 310,
  },
  md: {
    cardWidth: 220,
    cardHeight: 350,
  },
  lg: {
    cardWidth: 248,
    cardHeight: 394,
  },
};

const colorLabelMap: Record<MonopolyDealCardColor, string> = {
  any: "Any",
  brown: "Brown",
  light_blue: "Light Blue",
  pink: "Pink",
  orange: "Orange",
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  dark_blue: "Dark Blue",
  railroad: "Railroad",
  utility: "Utility",
};

const colorValueMap: Record<MonopolyDealCardColor, string> = {
  any: "linear-gradient(135deg, #d9d9d9 0%, #f7f7f7 100%)",
  brown: "#8f5d3b",
  light_blue: "#9fd7eb",
  pink: "#d689c1",
  orange: "#e4a356",
  red: "#d55a5a",
  yellow: "#e2c84d",
  green: "#5f9d6e",
  dark_blue: "#3a5f9d",
  railroad: "#8b8b8b",
  utility: "#9ec59d",
};

export function getCardFrameStyle(
  card: MonopolyDealCardData,
): { background: string; accentColor: string } {
  if (card.backgroundColor) {
    return {
      background: card.backgroundColor,
      accentColor: card.accentColor ?? "rgba(36, 41, 45, 0.72)",
    };
  }

  return {
    background: `linear-gradient(145deg, ${card.gradientFrom ?? "#d9d4c7"} 0%, ${
      card.gradientTo ?? "#f0ede4"
    } 100%)`,
    accentColor: card.accentColor ?? "rgba(36, 41, 45, 0.72)",
  };
}

export function getCardFaceStyleVars(
  card: MonopolyDealCardData,
  size: MonopolyDealCardSize,
  extras: Record<string, string> = {},
) {
  const dimensions = cardSizeMap[size];
  const frame = getCardFrameStyle(card);

  return {
    "--card-width-base": `${dimensions.cardWidth}px`,
    "--card-height-base": `${dimensions.cardHeight}px`,
    "--card-face-background": frame.background,
    "--card-accent-color": frame.accentColor,
    ...extras,
  };
}

export function formatMoney(value?: number) {
  if (value == null) {
    return "-";
  }

  return `$${value}M`;
}

export function formatCardColorLabel(color: MonopolyDealCardColor) {
  return colorLabelMap[color] ?? color.replace("_", " ");
}

export function getCardColorValue(color: MonopolyDealCardColor) {
  return colorValueMap[color] ?? "#d6d0c6";
}
