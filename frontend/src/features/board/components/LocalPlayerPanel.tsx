import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { HandTray } from "../../hand/components/HandTray";
import { BankStrip } from "../../bank/components/BankStrip";
import { TableauPanel } from "../../tableau/components/TableauPanel";
import type { LocalPlayerState } from "../model/localPlayer";
import { ActionHintBar } from "./ActionHintBar";

type LocalPlayerPanelProps = LocalPlayerState & {
  selectedHandCardId: string | null;
  draggingHandCardId: string | null;
  handTrayViewportRef: RefObject<HTMLDivElement>;
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
  handTrayViewportRef,
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
          <TableauPanel sets={propertySets} />
          <BankStrip cards={bankCards} total={bankTotal} />
        </div>
      </div>

      <div className="local-player-panel__hand-region">
        <ActionHintBar />
        <HandTray
          cards={handCards}
          selectedCardId={selectedHandCardId}
          draggingCardId={draggingHandCardId}
          viewportRef={handTrayViewportRef}
          onCardPress={onHandCardPress}
          onCardPointerDown={onHandCardPointerDown}
        />
      </div>
    </section>
  );
}
