type SurrenderNoticeSheetProps = {
  playerName: string;
  onDismiss: () => void;
};

export function SurrenderNoticeSheet({
  playerName,
  onDismiss,
}: SurrenderNoticeSheetProps) {
  return (
    <div className="board-modal-overlay" role="presentation">
      <section
        className="board-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="surrender-notice-title"
        aria-describedby="surrender-notice-detail"
      >
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Player Surrendered</p>
            <h2 id="surrender-notice-title">{playerName} left the match</h2>
          </div>
        </div>
        <div className="board-modal-sheet__body">
          <p id="surrender-notice-detail" className="board-modal-sheet__copy">
            {playerName} surrendered and was returned to the home page. The
            remaining table can keep playing from the updated board state.
          </p>
        </div>
        <div className="board-modal-sheet__footer">
          <button
            type="button"
            className="board-primary-button"
            onClick={onDismiss}
          >
            Continue Match
          </button>
        </div>
      </section>
    </div>
  );
}
