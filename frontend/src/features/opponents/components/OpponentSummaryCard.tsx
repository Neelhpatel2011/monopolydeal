import type { OpponentSummary } from "../model/opponentExpansion";
import { getOpponentTargetId } from "../../drag-targeting/model/target-preview";
import { WinnerCrownIcon } from "./WinnerCrownIcon";

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
  const visibleProperties = opponent.properties;
  const hasExpandedPropertyRows = visibleProperties.length > 4;
  const className = `opponent-summary-card${
    opponent.isCurrentPlayer ? " opponent-summary-card--current" : ""
  }${opponent.isWinner ? " opponent-summary-card--winner" : ""}${
    hasExpandedPropertyRows ? " opponent-summary-card--expanded-properties" : ""
  }${isTargetable ? " opponent-summary-card--targetable" : ""}${
    isInvalid ? " opponent-summary-card--invalid" : ""
  }${isPreviewed ? " opponent-summary-card--previewed" : ""}${
    browseSuppressed ? " opponent-summary-card--browse-suppressed" : ""
  }`;

  return (
    <div className="opponent-summary-card-wrap">
      <button
        className={className}
        type="button"
        aria-current={opponent.isCurrentPlayer ? "true" : undefined}
        aria-label={
          browseSuppressed
            ? `${opponent.name}${opponent.isWinner ? ", winner" : ""} summary`
            : `Open ${opponent.name}${opponent.isWinner ? ", winner" : ""} details`
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
        <div className="opponent-summary-card__identity">
          <div className="opponent-summary-card__avatar-wrap">
            <div className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
              {opponent.avatarInitial}
            </div>
            {opponent.isWinner ? (
              <span className="opponent-summary-card__winner-crown" aria-hidden="true">
                <WinnerCrownIcon className="opponent-summary-card__winner-crown-icon" />
              </span>
            ) : null}
          </div>

          <div className="opponent-summary-card__body">
            <h2>{opponent.name}</h2>
            <p className="opponent-summary-card__bank">{opponent.bankTotal}</p>
          </div>
        </div>

        <div
          className={`opponent-summary-card__properties${
            hasExpandedPropertyRows ? " opponent-summary-card__properties--expanded" : ""
          }`}
          aria-label={`${opponent.name} property progress`}
        >
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
    </div>
  );
}
