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

function lightenHex(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return "#e4dccb";
  }

  const channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16));
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${mixed.join("")}`;
}

function getPropertyHeaderPalette(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return {
      headingColor: "#122349",
      meterLine: "#6fa8d7",
      chipText: "#102046",
    };
  }

  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance < 0.55) {
    return {
      headingColor: "#fffaf0",
      meterLine: "rgba(255, 248, 240, 0.5)",
      chipText: "#122349",
    };
  }

  return {
    headingColor: "#122349",
    meterLine: "#6fa8d7",
    chipText: "#102046",
  };
}

export function PropertyCardFace({ card, size = "md" }: PropertyCardFaceProps) {
  const rents = card.rents ?? [];
  const rentRowCount = rents.length > 0 ? Math.min(card.setSize ?? rents.length, rents.length) : 0;
  const topColor = card.backgroundColor ?? "#7e9baa";
  const palette = getPropertyHeaderPalette(topColor);
  const isRailroad =
    card.colors?.length === 1 &&
    card.colors[0] === "railroad" &&
    card.setSize === 4;

  return (
    <CardFrame
      card={card}
      size={size}
      className={`monopoly-card--property${isRailroad ? " monopoly-card--property-railroad" : ""}`}
      innerClassName="monopoly-card__inner--property"
      showMoneyBadge
      styleOverrides={{
        "--card-face-background": "#f8f2e6",
        "--property-top-color": topColor,
        "--property-chip-background": lightenHex(topColor, 0.45),
        "--property-heading-color": palette.headingColor,
        "--property-meter-line": palette.meterLine,
        "--property-chip-text": palette.chipText,
      }}
    >
        <header className="property-card__header">
          <div className="property-card__header-copy">
            <p className="property-card__header-label">{card.label}</p>
            <h2 className="property-card__header-title">{card.name}</h2>
            <div className="property-card__header-meter" aria-hidden="true">
              <span className="property-card__header-meter-line" />
              <span className="property-card__header-meter-count">{card.setSize}/{card.setSize}</span>
              <span className="property-card__header-meter-line" />
            </div>
          </div>
        </header>

        <div className="property-card__body">
          <section className="property-card__rent-block" aria-label="Rent values">
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
                    <CardChip key={color} className="property-card__color-chip">
                      {formatCardColorLabel(color)}
                    </CardChip>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
    </CardFrame>
  );
}
