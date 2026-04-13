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
          <div className="pile-card__face pile-card__face--deck">Monopoly Deal</div>
        </div>
        <p>{drawCount} cards left</p>
      </div>

      <div className="drop-zone-panel">
        <p className="drop-zone-panel__title">Drag a card here</p>
        <p className="drop-zone-panel__subtitle">to play or start an action</p>
      </div>

      <div className="pile-card pile-card--right">
        <div className="pile-card__stack">
          <div className="pile-card__face pile-card__face--discard">Just Say No!</div>
        </div>
        <p>{discardCount} cards</p>
      </div>
    </section>
  );
}
