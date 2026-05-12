import type { ActionCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { CardFrame } from "./CardFrame";
import { getActionTargetBadge } from "./cardTargeting";

type ActionCardFaceProps = {
  card: ActionCardData;
  size?: MonopolyDealCardSize;
};

export function ActionCardFace({ card, size = "md" }: ActionCardFaceProps) {
  const targetBadge = getActionTargetBadge(card);

  return (
    <CardFrame card={card} size={size} className="monopoly-card--action" showMidLine showInnerLine showMoneyBadge>
        <div className="monopoly-card__content monopoly-card__content--action">
          <p className="action-card__label">{card.label}</p>

          <div className="action-card__stage">
            <div className="action-card__copy">
              <h2 className="action-card__title">{card.name}</h2>
              {targetBadge ? (
                <div
                  className="card-target-badge card-target-badge--action"
                  aria-label={`${targetBadge.description} ${targetBadge.label}: ${targetBadge.value}`}
                >
                  <span>{targetBadge.label}</span>
                  <strong>{targetBadge.value}</strong>
                </div>
              ) : null}
              {card.description ? <p className="action-card__description">{card.description}</p> : null}
            </div>
          </div>

          <div className="action-card__footer-space" />
        </div>
    </CardFrame>
  );
}
