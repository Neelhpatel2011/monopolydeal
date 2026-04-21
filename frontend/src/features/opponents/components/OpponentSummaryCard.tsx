import type { OpponentSummary } from "../model/opponentExpansion";
import { getOpponentTargetId } from "../../drag-targeting/model/target-preview";

type OpponentSummaryCardProps = {
  opponent: OpponentSummary;
  onOpen?: (opponentId: string) => void;
  browseSuppressed?: boolean;
  isTargetable?: boolean;
  isInvalid?: boolean;
  isPreviewed?: boolean;
};

export function OpponentSummaryCard({
  opponent,
  onOpen,
  browseSuppressed = false,
  isTargetable = false,
  isInvalid = false,
  isPreviewed = false,
}: OpponentSummaryCardProps) {
  const statsLabel = `${opponent.handCount} cards in hand, ${opponent.bankTotal} banked`;
  const visibleProperties = opponent.properties.slice(0, 4);
  const className = `opponent-summary-card${
    opponent.isCurrentPlayer ? " opponent-summary-card--current" : ""
  }${isTargetable ? " opponent-summary-card--targetable" : ""}${
    isInvalid ? " opponent-summary-card--invalid" : ""
  }${
    isPreviewed ? " opponent-summary-card--previewed" : ""
  }${browseSuppressed ? " opponent-summary-card--browse-suppressed" : ""}`;

  return (
    <button
      className={className}
      type="button"
      aria-current={opponent.isCurrentPlayer ? "true" : undefined}
      aria-label={
        browseSuppressed
          ? `${opponent.name} summary`
          : `Open ${opponent.name} details`
      }
      aria-disabled={browseSuppressed || undefined}
      data-board-target-id={getOpponentTargetId(opponent.id)}
      onClick={() => {
        if (browseSuppressed) {
          return;
        }

        onOpen?.(opponent.id);
      }}
    >
      {opponent.isCurrentPlayer ? (
        <div className="opponent-summary-card__status-row">
          <span className="opponent-summary-card__status">Current turn</span>
        </div>
      ) : null}

      <div className="opponent-summary-card__identity">
        <div className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
          {opponent.avatarInitial}
        </div>

        <div className="opponent-summary-card__body">
          <h2>{opponent.name}</h2>
          <p className="opponent-summary-card__bank">{opponent.bankTotal}</p>
        </div>

        <div className="opponent-summary-card__hand-count" aria-label={statsLabel}>
          {opponent.handCount}c
        </div>
      </div>

      <div className="opponent-summary-card__properties" aria-label={`${opponent.name} property progress`}>
        {visibleProperties.map((property) => (
          <div
            key={property.id}
            className={`opponent-property-bar opponent-property-bar--${property.color}${property.isComplete ? " opponent-property-bar--complete" : ""}`}
            title={`${property.color} set ${property.count} of ${property.targetSize}${property.isComplete ? ", complete" : ""}`}
          >
            <span className="opponent-property-bar__track" aria-hidden="true" />
            <span className="opponent-property-bar__count">
              {property.count}/{property.targetSize}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
