import { getLocalTableauSetTargetId } from "../../drag-targeting/model/target-preview";
import { BuildingIcon } from "../../../components/BuildingIcon";
import type { LocalPropertySet } from "../../board/model/localPlayer";
import { getPropertySetSummaryData } from "../model/propertySetSummary";

type PropertySetSummaryCardProps = {
  set: LocalPropertySet;
  isTargetable: boolean;
  isPreviewed: boolean;
  isInvalid: boolean;
  interactionLocked: boolean;
  onOpen: () => void;
  onTargetPress?: (setId: string) => void;
};

export function PropertySetSummaryCard({
  set,
  isTargetable,
  isPreviewed,
  isInvalid,
  interactionLocked,
  onOpen,
  onTargetPress,
}: PropertySetSummaryCardProps) {
  const summary = getPropertySetSummaryData(set);
  const targetId = getLocalTableauSetTargetId(set.id);

  return (
    <article
      className={`property-set${summary.isComplete ? " property-set--complete" : ""}${
        isTargetable ? " property-set--targetable" : ""
      }${isPreviewed ? " property-set--previewed" : ""}${
        isInvalid ? " property-set--invalid" : ""
      }`}
      data-board-target-id={targetId}
    >
      <button
        type="button"
        className="property-set__button"
        aria-label={`Open ${set.name} property set details`}
        aria-disabled={interactionLocked}
        data-board-target-id={targetId}
        onClick={() => {
          if (isTargetable && onTargetPress) {
            onTargetPress(set.id);
            return;
          }

          if (!interactionLocked) {
            onOpen();
          }
        }}
      >
        <span className="property-set__top-row">
          <span className="property-set__title-group">
            <span
              className={`property-set__swatch property-set__swatch--${set.color}`}
              aria-hidden="true"
            />
            <span className="property-set__title-copy">
              <span className="property-set__name">{set.name}</span>
              <span className="property-set__count-line">
                {summary.count}/{summary.targetSize}
              </span>
            </span>
          </span>

          <span className="property-set__status">
            {summary.isComplete ? "Full Set" : "In Play"}
          </span>
        </span>

        <span className="property-set__summary-list">
          <span className="property-set__summary-row">
            <span className="property-set__summary-label">Rent</span>
            <span className="property-set__summary-value">{summary.currentRentLabel}</span>
          </span>
          <span className="property-set__summary-row">
            <span className="property-set__summary-label">Wild</span>
            <span className="property-set__summary-value">x{summary.wildCount}</span>
          </span>
        </span>

        {summary.buildingKinds.length ? (
          <span className="property-set__buildings" aria-label="Buildings in this set">
            {summary.buildingKinds.map((building, index) => (
              <span
                key={`${building}-${index}`}
                className="property-set__building-chip"
                aria-label={building}
              >
                <BuildingIcon building={building} className="property-set__building-icon" />
              </span>
            ))}
          </span>
        ) : (
          <span className="property-set__buildings property-set__buildings--empty">
            <span className="property-set__summary-label">Buildings</span>
            <span className="property-set__empty-value">-</span>
          </span>
        )}
      </button>
    </article>
  );
}
