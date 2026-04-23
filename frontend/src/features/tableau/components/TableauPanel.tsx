import { useMemo, useState } from "react";
import type { LocalPropertySet } from "../../board/model/localPlayer";
import {
  LOCAL_TABLEAU_TARGET_ID,
  getLocalTableauSetTargetId,
} from "../../drag-targeting/model/target-preview";
import { PropertySetDetailSheet } from "./PropertySetDetailSheet";
import { PropertySetSummaryCard } from "./PropertySetSummaryCard";

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
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const targetableSetIdSet = useMemo(() => new Set(targetableSetIds), [targetableSetIds]);
  const expandedSet = useMemo(
    () => sets.find((set) => set.id === expandedSetId) ?? null,
    [expandedSetId, sets],
  );
  const interactionLocked = isTargetable || isPreviewed || isInvalid;

  return (
    <>
      <section
        className={`tableau-panel${isTargetable ? " tableau-panel--targetable" : ""}${
          isPreviewed ? " tableau-panel--previewed" : ""
        }${isInvalid ? " tableau-panel--invalid" : ""}`}
        aria-label="Played property sets"
        data-board-target-id={LOCAL_TABLEAU_TARGET_ID}
      >
        <div className="tableau-panel__sets" aria-label="Property sets">
          {sets.map((set) => {
            const setTargetId = getLocalTableauSetTargetId(set.id);

            return (
              <PropertySetSummaryCard
                key={set.id}
                set={set}
                isTargetable={targetableSetIdSet.has(setTargetId)}
                isPreviewed={previewedSetId === setTargetId}
                isInvalid={invalidSetId === setTargetId}
                interactionLocked={interactionLocked}
                onOpen={() => setExpandedSetId(set.id)}
              />
            );
          })}
        </div>
      </section>

      {expandedSet ? (
        <PropertySetDetailSheet
          set={expandedSet}
          onClose={() => setExpandedSetId(null)}
        />
      ) : null}
    </>
  );
}
