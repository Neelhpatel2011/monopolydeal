import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { HandTray } from "../../hand/components/HandTray";
import { BankStrip } from "../../bank/components/BankStrip";
import { TableauPanel } from "../../tableau/components/TableauPanel";
import type { LocalPlayerState } from "../model/localPlayer";
import type { ActionHintCopy } from "../../drag-targeting/model/target-preview";

type LocalPlayerPanelProps = LocalPlayerState & {
  selectedHandCardId: string | null;
  draggingHandCardId: string | null;
  invalidHandCardId: string | null;
  handTrayViewportRef: RefObject<HTMLDivElement>;
  actionHint: ActionHintCopy;
  isTableauTargetable: boolean;
  isTableauPreviewed: boolean;
  isTableauInvalid: boolean;
  targetableTableauSetIds: string[];
  previewedTableauSetId: string | null;
  invalidTableauSetId: string | null;
  isBankTargetable: boolean;
  isBankPreviewed: boolean;
  isBankInvalid: boolean;
  onHandCardPress: (cardId: string) => void;
  onHandCardPointerDown: (cardId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onTargetTableau?: () => void;
  onTargetTableauSet?: (setId: string) => void;
  onTargetBank?: () => void;
  onChangeWild?: (cardId: string, newColor: string) => Promise<void>;
};

export function LocalPlayerPanel({
  bankTotal,
  handCards,
  propertySets,
  bankCards,
  selectedHandCardId,
  draggingHandCardId,
  invalidHandCardId,
  handTrayViewportRef,
  isTableauTargetable,
  isTableauPreviewed,
  isTableauInvalid,
  targetableTableauSetIds,
  previewedTableauSetId,
  invalidTableauSetId,
  isBankTargetable,
  isBankPreviewed,
  isBankInvalid,
  onHandCardPress,
  onHandCardPointerDown,
  onTargetTableau,
  onTargetTableauSet,
  onTargetBank,
  onChangeWild,
}: LocalPlayerPanelProps) {
  return (
    <section className="local-player-panel" aria-label="Local player area">
      <div className="local-player-panel__committed-surface">
        <div className="local-player-panel__board-state">
          <TableauPanel
            sets={propertySets}
            isTargetable={isTableauTargetable}
            isPreviewed={isTableauPreviewed}
            isInvalid={isTableauInvalid}
            targetableSetIds={targetableTableauSetIds}
            previewedSetId={previewedTableauSetId}
            invalidSetId={invalidTableauSetId}
            onTargetTableau={onTargetTableau}
            onTargetSet={onTargetTableauSet}
            onChangeWild={onChangeWild}
          />
          <BankStrip
            cards={bankCards}
            total={bankTotal}
            isTargetable={isBankTargetable}
            isPreviewed={isBankPreviewed}
            isInvalid={isBankInvalid}
            onTargetPress={onTargetBank}
          />
        </div>
      </div>

      <div className="local-player-panel__hand-region">
        <HandTray
          cards={handCards}
          selectedCardId={selectedHandCardId}
          draggingCardId={draggingHandCardId}
          invalidCardId={invalidHandCardId}
          viewportRef={handTrayViewportRef}
          onCardPress={onHandCardPress}
          onCardPointerDown={onHandCardPointerDown}
        />
      </div>
    </section>
  );
}
