import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { HandTray } from "../../hand/components/HandTray";
import { BankStrip } from "../../bank/components/BankStrip";
import { TableauPanel } from "../../tableau/components/TableauPanel";
import type { LocalPlayerState } from "../model/localPlayer";
import { ActionHintBar } from "./ActionHintBar";
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
};

export function LocalPlayerPanel({
  name,
  handCount,
  bankTotal,
  handCards,
  propertySets,
  bankCards,
  selectedHandCardId,
  draggingHandCardId,
  invalidHandCardId,
  handTrayViewportRef,
  actionHint,
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
}: LocalPlayerPanelProps) {
  return (
    <section className="local-player-panel" aria-label="Local player area">
      <div className="local-player-panel__committed-surface">
        <div className="local-player-summary">
          <div className="local-player-summary__identity">
            <div className="avatar avatar--player">P</div>
            <div className="local-player-summary__name-block">
              <button className="local-player-summary__name" type="button">
                <span>{name}</span>
                <span aria-hidden="true">v</span>
              </button>
            </div>
          </div>

          <div className="local-player-summary__meta">
            <div className="local-player-summary__stats" aria-label="Player summary">
              <div>
                <strong>{handCount}</strong>
                <span>Cards</span>
              </div>
              <div>
                <strong>{bankTotal}</strong>
                <span>Bank</span>
              </div>
            </div>

            <button className="secondary-pill-button secondary-pill-button--quiet" type="button">
              Game Log
            </button>
          </div>
        </div>

        <div className="local-player-panel__board-state">
          <TableauPanel
            sets={propertySets}
            isTargetable={isTableauTargetable}
            isPreviewed={isTableauPreviewed}
            isInvalid={isTableauInvalid}
            targetableSetIds={targetableTableauSetIds}
            previewedSetId={previewedTableauSetId}
            invalidSetId={invalidTableauSetId}
          />
          <BankStrip
            cards={bankCards}
            total={bankTotal}
            isTargetable={isBankTargetable}
            isPreviewed={isBankPreviewed}
            isInvalid={isBankInvalid}
          />
        </div>
      </div>

      <div className="local-player-panel__hand-region">
        <ActionHintBar {...actionHint} />
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
