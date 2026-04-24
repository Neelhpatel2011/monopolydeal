import { BoardShell } from "../components/BoardShell";
import { useBoardSession } from "../hooks/useBoardSession";
import { useState } from "react";

function LobbyScreen({
  gameId,
  playerId,
  hostId,
  players,
  error,
  onStart,
}: {
  gameId: string;
  playerId: string;
  hostId: string | null | undefined;
  players: string[];
  error: string | null;
  onStart: () => Promise<unknown>;
}) {
  const isHost = hostId === playerId;
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function handleStart() {
    setIsStarting(true);
    setStartError(null);
    try {
      await onStart();
    } catch (startFailure) {
      setStartError(startFailure instanceof Error ? startFailure.message : "Could not start game.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="board-page">
      <div className="board-shell">
        <section className="board-loading-state board-lobby-state" aria-live="polite">
          <p className="board-loading-state__eyebrow">Lobby</p>
          <h1>Waiting to start</h1>
          <p>Game ID: <strong>{gameId}</strong></p>
          <p>You are playing as <strong>{playerId}</strong>.</p>
          <div className="board-lobby-state__players">
            {players.map((player) => (
              <span key={player}>{player}{player === hostId ? " host" : ""}</span>
            ))}
          </div>
          {error || startError ? (
            <p className="board-loading-state__error-copy">{startError ?? error}</p>
          ) : null}
          {isHost ? (
            <button
              type="button"
              className="board-primary-button"
              disabled={players.length < 2 || isStarting}
              onClick={() => void handleStart()}
            >
              {isStarting ? "Starting..." : players.length < 2 ? "Need 2 Players" : "Start Game"}
            </button>
          ) : (
            <p>Waiting for {hostId ?? "the host"} to start the game.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export function BoardScreen() {
  const session = useBoardSession();

  if (session.status === "error") {
    return (
      <main className="board-page">
        <div className="board-shell">
          <section className="board-loading-state board-loading-state--error" aria-live="polite">
            <p className="board-loading-state__eyebrow">Connection Error</p>
            <h1>Board unavailable</h1>
            <p>{session.error ?? "Could not load the backend game session."}</p>
          </section>
        </div>
      </main>
    );
  }

  if (session.status === "bootstrapping" || session.status === "loading") {
    return (
      <main className="board-page">
        <div className="board-shell">
          <section className="board-loading-state" aria-live="polite">
            <p className="board-loading-state__eyebrow">Connecting</p>
            <h1>Loading board</h1>
            <p>Syncing the live backend game state.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!session.view || !session.gameId || !session.playerId || !session.boardView) {
    return (
      <main className="board-page">
        <div className="board-shell">
          <section className="board-loading-state board-loading-state--error" aria-live="polite">
            <p className="board-loading-state__eyebrow">Connection Error</p>
            <h1>Board unavailable</h1>
            <p>{session.error ?? "Could not load the backend game session."}</p>
          </section>
        </div>
      </main>
    );
  }

  if (!session.view.started) {
    return (
      <LobbyScreen
        gameId={session.gameId}
        playerId={session.playerId}
        hostId={session.view.host_id}
        players={[session.view.you.id, ...session.view.others.map((player) => player.id)]}
        error={session.error}
        onStart={session.startGame}
      />
    );
  }

  return (
    <BoardShell
      roundLabel={`Round ${session.view.turn_number}`}
      actionsLeft={session.boardView.actionsLeft}
      opponentSummaries={session.boardView.opponentSummaries}
      opponentDetails={session.boardView.opponentDetails}
      localPlayer={session.boardView.localPlayer}
      playerView={session.view}
      discardTopCardId={session.boardView.discardTopCatalogCardId}
      drawCount={session.boardView.deckCount}
      blockingState={session.boardView.blockingState}
      onSubmitAction={session.submitAction}
      onSubmitPendingResponse={session.submitPendingResponse}
      onSubmitPayment={session.submitPayment}
      onSubmitDiscard={session.submitDiscard}
      onConfirmEndTurn={session.endTurn}
    />
  );
}
