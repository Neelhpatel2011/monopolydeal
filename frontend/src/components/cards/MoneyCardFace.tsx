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
      <div className="money-card__core">
        <div className="monopoly-card__icon-orb monopoly-card__icon-orb--money">
          <MoneyIcon />
        </div>
        <h2 className="money-card__title">{card.name}</h2>
      </div>

    </CardFrame>
  );
}
