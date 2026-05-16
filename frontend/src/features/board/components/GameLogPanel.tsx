import type { BackendGameLogEntryView } from "../../../integration/backend/contracts";
import { formatGameLogLine } from "../model/gameLog";

type GameLogPanelProps = {
  entries: BackendGameLogEntryView[];
  localPlayerId: string;
};

export function GameLogPanel({ entries, localPlayerId }: GameLogPanelProps) {
  const visibleEntries = entries.slice(-6).reverse();

  return (
    <section className="game-log-panel" aria-label="Game log">
      <div className="game-log-panel__header">
        <p>Game Log</p>
        <span>{entries.length === 0 ? "No plays yet" : "Latest plays"}</span>
      </div>
      {visibleEntries.length > 0 ? (
        <ol className="game-log-panel__list">
          {visibleEntries.map((entry) => (
            <li key={entry.id} className="game-log-panel__entry">
              <span className="game-log-panel__turn">R{entry.turn_number}</span>
              <span>{formatGameLogLine(entry, localPlayerId)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="game-log-panel__empty">Cards played by you and opponents will appear here.</p>
      )}
    </section>
  );
}
