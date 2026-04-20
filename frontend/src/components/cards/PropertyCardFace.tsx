import type { MonopolyDealCardSize, PropertyCardData } from "../../types/monopolyDeal";
import { CardChip } from "./CardChip";
import { CardFrame } from "./CardFrame";
import {
  formatCardColorLabel,
  formatMoney,
} from "./cardUtils";

type PropertyCardFaceProps = {
  card: PropertyCardData;
  size?: MonopolyDealCardSize;
};

export function PropertyCardFace({ card, size = "md" }: PropertyCardFaceProps) {
  const rents = card.rents ?? [];
  const rentRowCount = rents.length > 0 ? Math.min(card.setSize ?? rents.length, rents.length) : 0;

  return (
    <CardFrame
      card={card}
      size={size}
      className="monopoly-card--property"
      innerClassName="monopoly-card__inner--property"
      showMoneyBadge
      styleOverrides={{
        "--card-face-background": "#dfdbd1",
        "--property-top-color": card.backgroundColor ?? "#7e9baa",
      }}
    >
        <header className="property-card__header">
          <div className="property-card__header-copy">
            <p className="property-card__header-label">{card.label}</p>
            <h2 className="property-card__header-title">{card.name}</h2>
          </div>
        </header>

        <div className="property-card__body">
          <section className="property-card__rent-block" aria-label="Rent values">
            <p className="property-card__section-label">Rent</p>
            <div className="property-card__rent-list">
              {Array.from({ length: rentRowCount }).map((_, index) => {
                const count = index + 1;
                const isFull = count === rentRowCount;

                return (
                  <div
                    key={count}
                    className={`property-card__rent-row${isFull ? " property-card__rent-row--full" : ""}`}
                  >
                    <span className="property-card__rent-count">{count}</span>
                    <span className="property-card__rent-line" />
                    {isFull ? (
                      <span className="property-card__rent-value property-card__rent-value--full">{`FULL SET ${formatMoney(
                        rents[index],
                      )}`}</span>
                    ) : (
                      <span className="property-card__rent-value">{formatMoney(rents[index])}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {card.colors?.length ? (
            <section className="property-card__color-block">
              <div className="property-card__color-panel">
                <p className="property-card__section-label property-card__section-label--panel">Set Color</p>
                <div className="property-card__color-chip-list">
                  {card.colors.map((color) => (
                    <CardChip key={color}>{formatCardColorLabel(color)}</CardChip>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
    </CardFrame>
  );
}
