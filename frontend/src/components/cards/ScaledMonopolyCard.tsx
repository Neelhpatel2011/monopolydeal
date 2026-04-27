import type { CSSProperties } from "react";
import type { MonopolyDealCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { MonopolyDealCard } from "./MonopolyDealCard";
import { cardSizeMap } from "./cardUtils";

type ScaledMonopolyCardProps = {
  card: MonopolyDealCardData;
  size?: MonopolyDealCardSize;
  scale?: number;
  className?: string;
  surfaceClassName?: string;
};

export function ScaledMonopolyCard({
  card,
  size = "sm",
  scale = 1,
  className,
  surfaceClassName,
}: ScaledMonopolyCardProps) {
  const dimensions = cardSizeMap[size];
  const wrapperStyle = {
    width: `${dimensions.cardWidth * scale}px`,
    height: `${dimensions.cardHeight * scale}px`,
  } satisfies CSSProperties;
  const surfaceStyle = {
    width: `${dimensions.cardWidth}px`,
    height: `${dimensions.cardHeight}px`,
    transform: `scale(${scale})`,
  } satisfies CSSProperties;

  return (
    <div className={`scaled-monopoly-card${className ? ` ${className}` : ""}`} style={wrapperStyle}>
      <div
        className={`scaled-monopoly-card__surface${
          surfaceClassName ? ` ${surfaceClassName}` : ""
        }`}
        style={surfaceStyle}
      >
        <MonopolyDealCard card={card} size={size} />
      </div>
    </div>
  );
}
