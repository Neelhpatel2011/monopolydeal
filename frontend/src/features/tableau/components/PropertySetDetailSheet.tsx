import { useEffect } from "react";
import { BuildingIcon } from "../../../components/BuildingIcon";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import type { LocalPropertySet } from "../../board/model/localPlayer";
import { getPropertySetSummaryData } from "../model/propertySetSummary";

type PropertySetDetailSheetProps = {
  set: LocalPropertySet;
  onClose: () => void;
};

export function PropertySetDetailSheet({ set, onClose }: PropertySetDetailSheetProps) {
  const summary = getPropertySetSummaryData(set);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="property-set-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className="property-set-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${set.name} property set details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="property-set-detail-sheet__header">
          <div>
            <p className="property-set-detail-sheet__eyebrow">Property Set</p>
            <h2>{set.name}</h2>
          </div>

          <button
            type="button"
            className="property-set-detail-sheet__close"
            onClick={onClose}
            aria-label="Close property set details"
          >
            X
          </button>
        </div>

        <div className="property-set-detail-sheet__summary">
          <div className="property-set-detail-sheet__stat">
            <span>Count</span>
            <strong>
              {summary.count}/{summary.targetSize}
            </strong>
          </div>
          <div className="property-set-detail-sheet__stat">
            <span>Status</span>
            <strong>{summary.isComplete ? "Full Set" : "In Play"}</strong>
          </div>
          <div className="property-set-detail-sheet__stat">
            <span>Rent</span>
            <strong>{summary.currentRentLabel}</strong>
          </div>
          <div className="property-set-detail-sheet__stat">
            <span>Wilds</span>
            <strong>x{summary.wildCount}</strong>
          </div>
        </div>

        {summary.buildingKinds.length ? (
          <div className="property-set-detail-sheet__buildings">
            <span>Buildings</span>
            <div>
              {summary.buildingKinds.map((building, index) => (
                <span
                  key={`${building}-${index}`}
                  className="property-set-detail-sheet__building-chip"
                  aria-label={building}
                >
                  <BuildingIcon
                    building={building}
                    className="property-set-detail-sheet__building-icon"
                  />
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <section className="property-set-detail-sheet__section" aria-label="Cards in this set">
          <div className="property-set-detail-sheet__section-header">
            <h3>Cards</h3>
            <p>{summary.renderCards.length} total</p>
          </div>

          <div className="property-set-detail-sheet__cards">
            {summary.renderCards.map((card) => (
              <div key={card.id} className="property-set-detail-sheet__card">
                <ScaledMonopolyCard
                  card={card}
                  size="md"
                  scale={0.58}
                  className="property-set-detail-sheet__scaled-card"
                />
              </div>
            ))}
          </div>
        </section>

        {summary.rentSteps.length ? (
          <section className="property-set-detail-sheet__section" aria-label="Rent ladder">
            <div className="property-set-detail-sheet__section-header">
              <h3>Rent Table</h3>
            </div>

            <div className="property-set-detail-sheet__rent-table">
              {summary.rentSteps.map((step) => (
                <div
                  key={step.count}
                  className={`property-set-detail-sheet__rent-row${
                    step.isCurrent ? " property-set-detail-sheet__rent-row--current" : ""
                  }`}
                >
                  <span className="property-set-detail-sheet__rent-label">{step.label}</span>
                  <span className="property-set-detail-sheet__rent-line" />
                  <strong>{step.amountLabel}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="property-set-detail-sheet__section" aria-label="Card values">
          <div className="property-set-detail-sheet__section-header">
            <h3>Card Values</h3>
          </div>

          <div className="property-set-detail-sheet__value-list">
            {summary.cardValueLabels.map((valueLabel) => (
              <span key={valueLabel} className="property-set-detail-sheet__value-chip">
                {valueLabel}
              </span>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
