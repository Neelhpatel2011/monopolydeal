import type { BackendGameLogEntryView } from "../../../integration/backend/contracts";
import { formatGameLogLine } from "../model/gameLog";

type GameLogModalProps = {
  isOpen: boolean;
  entries: BackendGameLogEntryView[];
  localPlayerId: string;
  onClose: () => void;
};

export function GameLogModal({ isOpen, entries, localPlayerId, onClose }: GameLogModalProps) {
  if (!isOpen) {
    return null;
  }

  const visibleEntries = [...entries].reverse();

  return (
    <div className="board-overlay" role="presentation" onClick={onClose}>
      <section
        className="board-modal-sheet game-log-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Game log"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="board-modal-sheet__header game-log-modal__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Match Activity</p>
            <h2>Game Log</h2>
          </div>
          <button type="button" className="board-modal-sheet__close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="board-modal-sheet__body game-log-modal__body">
          {visibleEntries.length > 0 ? (
            <ol className="game-log-modal__list">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="game-log-modal__entry">
                  <span className="game-log-modal__turn">R{entry.turn_number}</span>
                  <span>{formatGameLogLine(entry, localPlayerId)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="game-log-modal__empty">Cards played by you and opponents will appear here.</p>
          )}
        </div>
      </section>
    </div>
  );
}
