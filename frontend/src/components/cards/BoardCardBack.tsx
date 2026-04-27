import type { CSSProperties } from "react";
import { cardSizeMap } from "./cardUtils";
import type { MonopolyDealCardSize } from "../../types/monopolyDeal";
import greedCardBackIcon from "../../assets/card_back_greed_icon_svg.svg";

type BoardCardBackProps = {
  label?: string;
  tone?: "deck" | "discard";
  size?: MonopolyDealCardSize;
  scale?: number;
  className?: string;
};

export function BoardCardBack({
  label,
  tone = "deck",
  size = "sm",
  scale = 1,
  className,
}: BoardCardBackProps) {
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
    <div className={`board-card-back${className ? ` ${className}` : ""}`} style={wrapperStyle}>
      <div
        className={`board-card-back__surface board-card-back__surface--${tone}`}
        style={surfaceStyle}
        aria-hidden="true"
      >
        <div className="board-card-back__frame">
          <div className="board-card-back__crest">
            <img src={greedCardBackIcon} className="board-card-back__crest-image" alt="" aria-hidden="true" />
          </div>
          {label ? <div className="board-card-back__label">{label}</div> : null}
        </div>
      </div>
    </div>
  );
}
