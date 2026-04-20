import type { MoneyCardData, MonopolyDealCardSize } from "../../types/monopolyDeal";
import { MoneyIcon } from "./CardIcons";
import { CardFrame } from "./CardFrame";

type MoneyCardFaceProps = {
  card: MoneyCardData;
  size?: MonopolyDealCardSize;
};

export function MoneyCardFace({ card, size = "md" }: MoneyCardFaceProps) {
  return (
    <CardFrame
      card={card}
      size={size}
      className="monopoly-card--money"
      innerClassName="monopoly-card__inner--money"
      showMoneyBadge
    >
      <p className="monopoly-card__eyebrow monopoly-card__eyebrow--money">{card.label}</p>

      <div className="money-card__core">
        <div className="monopoly-card__icon-orb monopoly-card__icon-orb--money">
          <MoneyIcon />
        </div>
        <div className="money-card__title-block">
          <h2 className="money-card__title">{card.name}</h2>
          <div className="money-card__rule" />
        </div>
        {card.description ? <p className="money-card__description">{card.description}</p> : null}
      </div>

    </CardFrame>
  );
}
