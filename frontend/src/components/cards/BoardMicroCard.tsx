import type { CSSProperties } from "react";
import { getCardIcon } from "./getCardIcon";
import type { MonopolyDealCardData } from "../../types/monopolyDeal";
import { getCardFrameStyle } from "./cardUtils";

type BoardMicroCardProps = {
  card: MonopolyDealCardData;
  className?: string;
};

export function BoardMicroCard({ card, className }: BoardMicroCardProps) {
  const Icon = getCardIcon(card.icon ?? card.type);
  const frame = getCardFrameStyle(card);
  const title = card.type === "money" ? card.value : card.name;

  return (
    <div
      className={`board-micro-card board-micro-card--${card.type}${className ? ` ${className}` : ""}`}
      style={
        {
          "--board-micro-card-background": frame.background,
          "--board-micro-card-accent": frame.accentColor,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="board-micro-card__value">{card.value}</div>
      <div className="board-micro-card__body">
        <span className="board-micro-card__icon">
          <Icon className="board-micro-card__icon-svg" />
        </span>
        <span className="board-micro-card__title">{title}</span>
      </div>
    </div>
  );
}
