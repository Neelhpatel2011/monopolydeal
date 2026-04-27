import { BoardCardBack } from "../../../components/cards/BoardCardBack";
import { getRenderCardByCatalogId } from "../../../components/cards/boardCardAdapters";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { BOARD_PLAY_TARGET_ID } from "../../drag-targeting/model/target-preview";

type BoardCenterStageProps = {
  drawCount: number;
  discardCount: number;
  discardTopCardId?: string;
  onPlayZonePress?: () => void;
};

export function BoardCenterStage({
  drawCount,
  discardCount,
  discardTopCardId,
  onPlayZonePress,
}: BoardCenterStageProps) {
  void drawCount;
  const hasDiscardTopCard = discardCount > 0 && typeof discardTopCardId === "string";

  return (
    <section className="board-center-stage" aria-label="Board center stage">
      <div className="pile-card">
        <div className="pile-card__stack pile-card__stack--deck">
          <div className="pile-card__face pile-card__face--deck">
            <BoardCardBack tone="deck" size="sm" scale={0.28} className="pile-card__card-back" />
          </div>
        </div>
        <p className="pile-card__label">Deck</p>
      </div>

      <button
        type="button"
        className="drop-zone-panel"
        data-board-target-id={BOARD_PLAY_TARGET_ID}
        onClick={onPlayZonePress}
      >
        <p className="drop-zone-panel__mark" aria-hidden="true">GREED</p>
        <p className="drop-zone-panel__subtitle">Drag a card here to play an action</p>
      </button>

      <div className="pile-card pile-card--right">
        <div className="pile-card__stack">
          <div className="pile-card__face pile-card__face--discard">
            {hasDiscardTopCard ? (
              <ScaledMonopolyCard
                card={getRenderCardByCatalogId(discardTopCardId)}
                size="sm"
                scale={0.28}
                className="pile-card__discard-card"
              />
            ) : (
              <BoardCardBack
                tone="discard"
                label="Empty"
                size="sm"
                scale={0.28}
                className="pile-card__card-back"
              />
            )}
          </div>
        </div>
        <p className="pile-card__label">Discard</p>
      </div>
    </section>
  );
}
