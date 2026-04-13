import type { OpponentSummary } from "../model/opponentExpansion";

type OpponentSummaryCardProps = {
  opponent: OpponentSummary;
  onOpen?: (opponentId: string) => void;
};

export function OpponentSummaryCard({ opponent, onOpen }: OpponentSummaryCardProps) {
  const statsLabel = `${opponent.handCount} cards in hand, ${opponent.bankTotal} banked`;

  return (
    <button
      className={`opponent-summary-card${opponent.isCurrentPlayer ? " opponent-summary-card--current" : ""}`}
      type="button"
      aria-current={opponent.isCurrentPlayer ? "true" : undefined}
      aria-label={`Open ${opponent.name} details`}
      onClick={() => onOpen?.(opponent.id)}
    >
      <div className="opponent-summary-card__toolbar">
        {opponent.isCurrentPlayer ? (
          <span className="opponent-summary-card__status">Current turn</span>
        ) : (
          <span />
        )}

        <span className="opponent-summary-card__more" aria-hidden="true">
          ...
        </span>
      </div>

      <div className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
        {opponent.avatarInitial}
      </div>

      <div className="opponent-summary-card__body">
        <h2>{opponent.name}</h2>
        <p className="opponent-summary-card__stats" aria-label={statsLabel}>
          <span>{opponent.handCount}C</span>
          <span>{opponent.bankTotal}</span>
        </p>
      </div>

      <div className="opponent-summary-card__properties" aria-label={`${opponent.name} property progress`}>
        {opponent.properties.map((property) => (
          <div
            key={property.id}
            className={`opponent-property-chip opponent-property-chip--${property.color}${property.isComplete ? " opponent-property-chip--complete" : ""}`}
            title={`${property.color} set ${property.count} of ${property.targetSize}${property.isComplete ? ", complete" : ""}`}
          >
            <span className="opponent-property-chip__swatch" aria-hidden="true" />
            <span className="opponent-property-chip__count">
              {property.count}/{property.targetSize}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
