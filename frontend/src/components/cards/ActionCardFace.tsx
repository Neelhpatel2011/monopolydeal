import type { ActionCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { CardFrame } from "./CardFrame";

type ActionCardFaceProps = {
  card: ActionCardData;
  size?: MonopolyDealCardSize;
};

export function ActionCardFace({ card, size = "md" }: ActionCardFaceProps) {
  return (
    <CardFrame card={card} size={size} className="monopoly-card--action" showMidLine showInnerLine showMoneyBadge>
        <div className="monopoly-card__content monopoly-card__content--action">
          <p className="action-card__label">{card.label}</p>

          <div className="action-card__stage">
            <div className="action-card__copy">
              <h2 className="action-card__title">{card.name}</h2>
              {card.description ? <p className="action-card__description">{card.description}</p> : null}
            </div>
          </div>

          <div className="action-card__footer-space" />
        </div>
    </CardFrame>
  );
}
