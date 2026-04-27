import type { CSSProperties, ReactNode } from "react";
import type { MonopolyDealCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { CardMoneyBadge } from "./CardMoneyBadge";
import { getCardFaceStyleVars } from "./cardUtils";

type CardFrameProps = {
  card: MonopolyDealCardData;
  size: MonopolyDealCardSize;
  className: string;
  innerClassName?: string;
  styleOverrides?: Record<string, string>;
  showMidLine?: boolean;
  showInnerLine?: boolean;
  showMoneyBadge?: boolean;
  children: ReactNode;
};

export function CardFrame({
  card,
  size,
  className,
  innerClassName,
  styleOverrides,
  showMidLine = false,
  showInnerLine = false,
  showMoneyBadge = false,
  children,
}: CardFrameProps) {
  return (
    <article
      className={`monopoly-card ${className} monopoly-card--${size}`}
      style={getCardFaceStyleVars(card, size, styleOverrides) as CSSProperties}
    >
      <div className={`monopoly-card__inner${innerClassName ? ` ${innerClassName}` : ""}`}>
        {showMidLine ? <div className="monopoly-card__line monopoly-card__line--mid" /> : null}
        {showInnerLine ? <div className="monopoly-card__line monopoly-card__line--inner" /> : null}
        {showMoneyBadge ? <CardMoneyBadge value={card.value} /> : null}
        {children}
      </div>
    </article>
  );
}
