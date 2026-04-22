import type { CSSProperties } from "react";
import type { LocalPropertySet } from "../../board/model/localPlayer";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { boardCardSurfacePresets } from "../../../components/cards/boardCardSurfaces";
import { getPropertySetRenderCards } from "../../../components/cards/boardCardAdapters";
import {
  LOCAL_TABLEAU_TARGET_ID,
  getLocalTableauSetTargetId,
} from "../../drag-targeting/model/target-preview";

type TableauPanelProps = {
  sets: LocalPropertySet[];
  isTargetable?: boolean;
  isPreviewed?: boolean;
  isInvalid?: boolean;
  targetableSetIds?: string[];
  previewedSetId?: string | null;
  invalidSetId?: string | null;
};

export function TableauPanel({
  sets,
  isTargetable = false,
  isPreviewed = false,
  isInvalid = false,
  targetableSetIds = [],
  previewedSetId = null,
  invalidSetId = null,
}: TableauPanelProps) {
  const targetableSetIdSet = new Set(targetableSetIds);
  const surfacePreset = boardCardSurfacePresets.tableau;
  const buildingEmoji: Record<string, string> = {
    House: "🏠",
    Hotel: "🏨",
  };

  return (
    <section
      className={`tableau-panel${isTargetable ? " tableau-panel--targetable" : ""}${
        isPreviewed ? " tableau-panel--previewed" : ""
      }${isInvalid ? " tableau-panel--invalid" : ""}`}
      aria-label="Played property sets"
      data-board-target-id={LOCAL_TABLEAU_TARGET_ID}
    >
      <div className="tableau-panel__sets" aria-label="Property sets">
        {sets.map((set) => {
          const count = set.cards.length;
          const isComplete = count >= set.targetSize;
          const renderCards = getPropertySetRenderCards(set);

          return (
            <article
              key={set.id}
              className={`property-set${isComplete ? " property-set--complete" : ""}${
                targetableSetIdSet.has(getLocalTableauSetTargetId(set.id))
                  ? " property-set--targetable"
                  : ""
              }${
                previewedSetId === getLocalTableauSetTargetId(set.id)
                  ? " property-set--previewed"
                  : ""
              }${
                invalidSetId === getLocalTableauSetTargetId(set.id)
                  ? " property-set--invalid"
                  : ""
              }`}
              data-board-target-id={getLocalTableauSetTargetId(set.id)}
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

              <div className="property-set__stack" aria-label={`${set.name} cards`}>
                {set.cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="property-set__card"
                    style={{ "--stack-index": index } as CSSProperties}
                  >
                    <ScaledMonopolyCard
                      card={renderCards[index]}
                      size={surfacePreset.size}
                      scale={surfacePreset.scale}
                      className="property-set__scaled-card"
                    />
                  </div>
                ))}
              </div>

              <div className="property-set__footer">
                {set.buildings?.length ? (
                  <div className="property-set__buildings">
                    {set.buildings.map((building) => (
                      <span key={building} className="property-set__building-chip">
                        <span aria-hidden="true">{buildingEmoji[building] ?? "🃏"}</span>
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
  );
}
