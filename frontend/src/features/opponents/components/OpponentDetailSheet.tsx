import { useEffect } from "react";
import type { CSSProperties } from "react";
import { OpponentQuickSwitch } from "./OpponentQuickSwitch";
import type { OpponentDetail } from "../model/opponentExpansion";

type OpponentDetailSheetProps = {
  opponent: OpponentDetail;
  opponents: OpponentDetail[];
  onClose: () => void;
  onSelectOpponent: (opponentId: string) => void;
};

export function OpponentDetailSheet({
  opponent,
  opponents,
  onClose,
  onSelectOpponent,
}: OpponentDetailSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="opponent-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className="opponent-detail-sheet"
        id={`opponent-detail-sheet-${opponent.id}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${opponent.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="opponent-detail-sheet__header">
          <h2>Opponent</h2>
          <button
            className="opponent-detail-sheet__close"
            type="button"
            onClick={onClose}
            aria-label="Close opponent details"
          >
            X
          </button>
        </div>

        <div className="opponent-detail-sheet__identity">
          <div className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
            {opponent.avatarInitial}
          </div>

          <div>
            <h3>{opponent.name}</h3>
            <p>
              {opponent.handCount} cards | {opponent.bankTotal} bank
            </p>
          </div>
        </div>

        <section className="opponent-detail-sheet__section" aria-label="Properties">
          <div className="opponent-detail-sheet__section-header">
            <h4>Properties</h4>
          </div>

          <div className="opponent-detail-properties">
            {opponent.propertySets.map((propertySet) => {
              const count = propertySet.cards.length;
              const isComplete = count >= propertySet.targetSize;

              return (
                <article
                  key={propertySet.id}
                  className={`opponent-detail-property${
                    isComplete ? " opponent-detail-property--complete" : ""
                  }`}
                >
                  <div
                    className={`opponent-detail-property__stack opponent-detail-property__stack--${propertySet.color}`}
                    aria-hidden="true"
                  >
                    {propertySet.cards.map((card, index) => (
                      <span
                        key={card.id}
                        className={`opponent-detail-property__card${
                          card.kind === "wild" ? " opponent-detail-property__card--wild" : ""
                        }`}
                        style={{ "--detail-stack-index": index } as CSSProperties}
                      />
                    ))}
                  </div>

                  <div className="opponent-detail-property__body">
                    <div className="opponent-detail-property__title-row">
                      <p className="opponent-detail-property__label">{propertySet.name}</p>
                      <span className="opponent-detail-property__count">
                        {count}/{propertySet.targetSize}
                      </span>
                    </div>

                    <p className="opponent-detail-property__meta">
                      {isComplete ? "Full Set" : "In Progress"}
                    </p>

                    {propertySet.buildings?.length ? (
                      <div className="opponent-detail-property__buildings">
                        {propertySet.buildings.map((building) => (
                          <span key={building} className="opponent-detail-property__building-chip">
                            {building}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="opponent-detail-sheet__section" aria-label="Money">
          <div className="opponent-detail-sheet__section-header">
            <h4>Money</h4>
          </div>

          <div className="opponent-detail-money">
            {opponent.moneyCards.map((card) => (
              <article
                key={card.id}
                className={`opponent-detail-money__card opponent-detail-money__card--${card.tone}`}
                aria-label={`${card.amount} ${card.label}`}
              >
                <span className="opponent-detail-money__amount">{card.amount}</span>
                <span className="opponent-detail-money__label">{card.label}</span>
              </article>
            ))}
          </div>
        </section>

        <OpponentQuickSwitch
          activeOpponentId={opponent.id}
          opponents={opponents}
          onSelectOpponent={onSelectOpponent}
        />
      </section>
    </div>
  );
}
