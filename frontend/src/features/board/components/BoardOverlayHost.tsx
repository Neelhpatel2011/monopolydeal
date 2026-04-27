import type { ResolvedBoardOverlay } from "../model/blocking-overlays";

type BoardOverlayHostProps = {
  overlay: ResolvedBoardOverlay | null;
  onDismissGameOver?: () => void;
};

function getOverlayFooterCopy(kind: ResolvedBoardOverlay["kind"]) {
  switch (kind) {
    case "game_over":
      return "Normal play is locked while the final state is shown.";
    case "pending_prompt":
      return "Prompt resolution has priority over all other board actions.";
    case "payment_required":
      return "Payment must be resolved before normal play can resume.";
    case "discard_required":
      return "Discard must be completed before you can continue or end the turn.";
    default:
      return "Normal play is paused.";
  }
}

export function BoardOverlayHost({
  overlay,
  onDismissGameOver,
}: BoardOverlayHostProps) {
  if (!overlay) {
    return null;
  }

  const isGameOver = overlay.kind === "game_over";

  return (
    <div
      className={`board-overlay-host${isGameOver ? " board-overlay-host--game-over" : ""}`}
      role="presentation"
    >
      {isGameOver ? null : <div className="board-overlay-host__backdrop" />}
      <section
        className={`board-overlay-host__sheet board-overlay-host__sheet--${overlay.kind}`}
        role="dialog"
        aria-modal={isGameOver ? undefined : true}
        aria-labelledby="board-overlay-title"
        aria-describedby="board-overlay-detail"
      >
        <div className="board-overlay-host__header">
          <div className="board-overlay-host__header-copy">
            <p className="board-overlay-host__eyebrow">{overlay.eyebrow}</p>
            <span className="board-overlay-host__badge">{overlay.emphasisLabel}</span>
          </div>
          {isGameOver && onDismissGameOver ? (
            <button
              type="button"
              className="board-overlay-host__dismiss"
              aria-label="Close game over summary"
              onClick={onDismissGameOver}
            >
              X
            </button>
          ) : null}
        </div>

        <div className="board-overlay-host__copy">
          <h2 id="board-overlay-title">{overlay.title}</h2>
          <p id="board-overlay-detail">{overlay.detail}</p>
        </div>

        {isGameOver ? null : (
          <p className="board-overlay-host__footer">{getOverlayFooterCopy(overlay.kind)}</p>
        )}
      </section>
    </div>
  );
}
