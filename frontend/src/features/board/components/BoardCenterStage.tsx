import { BoardCardBack } from "../../../components/cards/BoardCardBack";

type BoardCenterStageProps = {
  drawCount: number;
  discardCount: number;
};

export function BoardCenterStage({
  drawCount,
  discardCount,
}: BoardCenterStageProps) {
  return (
    <section className="board-center-stage" aria-label="Board center stage">
      <div className="pile-card">
        <div className="pile-card__stack pile-card__stack--deck">
          <div className="pile-card__face pile-card__face--deck">
            <BoardCardBack label="Deck" tone="deck" size="sm" scale={0.48} className="pile-card__card-back" />
            <span className="pile-card__overlay-label">Deck</span>
          </div>
        </div>
        <p className="pile-card__count-pill">{drawCount} cards left</p>
      </div>

      <div className="drop-zone-panel">
        <p className="drop-zone-panel__mark" aria-hidden="true">MD</p>
        <p className="drop-zone-panel__title">Play a Card</p>
        <p className="drop-zone-panel__subtitle">Drag a card here</p>
        <p className="drop-zone-panel__subtitle">to play an action</p>
      </div>

      <div className="pile-card pile-card--right">
        <div className="pile-card__stack">
          <div className="pile-card__face pile-card__face--discard">
            <BoardCardBack
              label="Played"
              tone="discard"
              size="sm"
              scale={0.48}
              className="pile-card__card-back"
            />
            <span className="pile-card__overlay-label">Discard</span>
          </div>
        </div>
        <p className="pile-card__count-pill">{discardCount} cards</p>
      </div>
    </section>
  );
}
