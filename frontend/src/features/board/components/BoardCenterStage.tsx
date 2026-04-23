import { BoardCardBack } from "../../../components/cards/BoardCardBack";
import { getRenderCardByCatalogId } from "../../../components/cards/boardCardAdapters";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";

type BoardCenterStageProps = {
  drawCount: number;
  discardCount: number;
  discardTopCardId?: string;
};

export function BoardCenterStage({
  drawCount,
  discardCount,
  discardTopCardId = "action-just-say-no",
}: BoardCenterStageProps) {
  void drawCount;
  void discardCount;

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

      <div className="drop-zone-panel">
        <p className="drop-zone-panel__mark" aria-hidden="true">GREED</p>
        <p className="drop-zone-panel__subtitle">Drag a card here to play an action</p>
      </div>

      <div className="pile-card pile-card--right">
        <div className="pile-card__stack">
          <div className="pile-card__face pile-card__face--discard">
            <ScaledMonopolyCard
              card={getRenderCardByCatalogId(discardTopCardId)}
              size="sm"
              scale={0.28}
              className="pile-card__discard-card"
            />
          </div>
        </div>
        <p className="pile-card__label">Discard</p>
      </div>
    </section>
  );
}
