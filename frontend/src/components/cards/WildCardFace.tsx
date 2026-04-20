import type { MonopolyDealCardSize, WildCardData } from "../../types/monopolyDeal";
import { CardChip } from "./CardChip";
import { CardFrame } from "./CardFrame";
import { WildIcon } from "./CardIcons";
import { formatCardColorLabel } from "./cardUtils";

type WildCardFaceProps = {
  card: WildCardData;
  size?: MonopolyDealCardSize;
};

export function WildCardFace({ card, size = "md" }: WildCardFaceProps) {
  return (
    <CardFrame card={card} size={size} className="monopoly-card--wild" showMoneyBadge>
        <div className="monopoly-card__content monopoly-card__content--wild">
          <p className="wild-card__label">{card.label}</p>

          <div className="wild-card__icon-wrap">
            <WildIcon className="wild-card__icon" />
          </div>

          <h2 className="wild-card__title">{card.name}</h2>

          {card.colors?.length ? (
            <div className="wild-card__chips">
              <div className="wild-card__chip-list">
                {card.colors.map((color) => (
                  <CardChip key={color}>{formatCardColorLabel(color)}</CardChip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
    </CardFrame>
  );
}
