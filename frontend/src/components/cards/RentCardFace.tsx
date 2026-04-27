import type { MonopolyDealCardSize, RentCardData } from "../../types/monopolyDeal";
import { CardChip } from "./CardChip";
import { CardFrame } from "./CardFrame";
import { getCardIcon } from "./getCardIcon";
import { formatCardColorLabel } from "./cardUtils";

type RentCardFaceProps = {
  card: RentCardData;
  size?: MonopolyDealCardSize;
};

export function RentCardFace({ card, size = "md" }: RentCardFaceProps) {
  const Icon = getCardIcon(card.icon);
  const isMulticolorRent = card.rentColors.includes("any");
  const label = isMulticolorRent ? "Multicolor Rent" : card.label;
  const summary = isMulticolorRent
    ? "Charge rent on any property set."
    : "Charge rent for these property sets.";
  const styleOverrides = isMulticolorRent
    ? {
        "--card-face-background":
          "radial-gradient(circle at top left, rgba(188, 219, 255, 0.95) 0%, rgba(188, 219, 255, 0) 52%), radial-gradient(circle at top right, rgba(245, 191, 220, 0.9) 0%, rgba(245, 191, 220, 0) 50%), radial-gradient(circle at bottom right, rgba(246, 222, 144, 0.92) 0%, rgba(246, 222, 144, 0) 52%), radial-gradient(circle at bottom left, rgba(190, 227, 187, 0.92) 0%, rgba(190, 227, 187, 0) 52%), linear-gradient(135deg, #d6dced 0%, #ddd1e5 100%)",
      }
    : undefined;

  return (
    <CardFrame
      card={card}
      size={size}
      className="monopoly-card--rent"
      showMoneyBadge
      styleOverrides={styleOverrides}
    >
        <div className="monopoly-card__content monopoly-card__content--rent">
          <p className="rent-card__label">{label}</p>

          <div className="rent-card__icon-wrap">
            <div className="rent-card__medallion">
              <Icon />
            </div>
          </div>

          <p className="rent-card__description">{summary}</p>

          {card.rentColors?.length ? (
            <div className="rent-card__footer">
              <div className="rent-card__chip-list">
                {card.rentColors.map((color) => (
                  <CardChip key={color}>{formatCardColorLabel(color)}</CardChip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
    </CardFrame>
  );
}
