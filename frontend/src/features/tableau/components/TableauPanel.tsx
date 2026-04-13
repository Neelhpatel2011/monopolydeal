import type { CSSProperties } from "react";
import type { LocalPropertySet } from "../../board/model/localPlayer";

type TableauPanelProps = {
  sets: LocalPropertySet[];
};

export function TableauPanel({ sets }: TableauPanelProps) {
  return (
    <section className="tableau-panel" aria-label="Played property sets">
      <div className="tableau-panel__header">
        <div>
          <p className="tableau-panel__eyebrow">Tableau</p>
          <h2>Properties</h2>
        </div>
        <p className="tableau-panel__total">{sets.length} sets</p>
      </div>

      <div className="tableau-panel__sets" aria-label="Property sets">
        {sets.map((set) => {
          const count = set.cards.length;
          const isComplete = count >= set.targetSize;
          const remaining = Math.max(set.targetSize - count, 0);

          return (
            <article
              key={set.id}
              className={`property-set${isComplete ? " property-set--complete" : ""}`}
            >
              <div className="property-set__header">
                <div className="property-set__title-group">
                  <span
                    className={`property-set__swatch property-set__swatch--${set.color}`}
                    aria-hidden="true"
                  />
                  <div>
                    <h3>{set.name}</h3>
                    <p>{count}/{set.targetSize}</p>
                  </div>
                </div>

                <span className="property-set__count">{isComplete ? "Full set" : "In play"}</span>
              </div>

              <div className="property-set__stack" aria-hidden="true">
                {set.cards.map((card, index) => (
                  <span
                    key={card.id}
                    className={`tableau-mini-card tableau-mini-card--${set.color}${
                      card.kind === "wild" ? " tableau-mini-card--wild" : ""
                    }`}
                    style={{ "--stack-index": index } as CSSProperties}
                  />
                ))}
              </div>

              <div className="property-set__footer">
                <span className="property-set__meter">
                  {count}/{set.targetSize}
                </span>

                {set.buildings?.length ? (
                  <div className="property-set__buildings">
                    {set.buildings.map((building) => (
                      <span key={building} className="property-set__building-chip">
                        {building}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="property-set__footnote" aria-hidden="true">
                    <span>{isComplete ? "Ready" : "In progress"}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
