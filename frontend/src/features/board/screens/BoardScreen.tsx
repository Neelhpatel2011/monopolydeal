import { BoardShell } from "../components/BoardShell";
import { useBoardSession } from "../hooks/useBoardSession";
import { useState } from "react";

const MIN_PLAYERS_TO_START = 2;
const MAX_LOBBY_PLAYERS = 4;

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 3h8a3 3 0 0 1 3 3v8h-2V6a1 1 0 0 0-1-1H9V3Zm-4 4h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5Z"
        fill="currentColor"
      />
    </svg>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

function getInviteMessage(gameCode: string) {
  return `Join my Greed Deal game at ${window.location.origin} with code ${gameCode}.`;
}

function LobbyScreen({
  gameId,
  gameCode,
  playerId,
  hostId,
  players,
  error,
  onStart,
}: {
  gameId: string;
  gameCode: string | null;
  playerId: string;
  hostId: string | null | undefined;
  players: string[];
  error: string | null;
  onStart: () => Promise<unknown>;
}) {
  const isHost = hostId === playerId;
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "error">("idle");
  const [inviteFeedback, setInviteFeedback] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const displayCode = gameCode ?? gameId;
  const playersNeeded = Math.max(0, MIN_PLAYERS_TO_START - players.length);
  const seatsRemaining = Math.max(0, MAX_LOBBY_PLAYERS - players.length);
  const isLobbyFull = players.length >= MAX_LOBBY_PLAYERS;
  const filledSeatLabel = `${players.length}/${MAX_LOBBY_PLAYERS}`;
  const emptySeats = Math.max(0, MAX_LOBBY_PLAYERS - players.length);
  const lobbyStatus = playersNeeded > 0
    ? `${playersNeeded} more needed`
    : isLobbyFull
      ? "Table full"
      : "Ready to start";
  const guestStatusCopy = playersNeeded > 0
    ? `Waiting for ${playersNeeded === 1 ? "1 more player" : `${playersNeeded} more players`}.`
    : `Waiting for ${hostId ?? "the host"} to start.`;
  const seatSummary = `${players.length} seated · ${seatsRemaining} ${seatsRemaining === 1 ? "seat" : "seats"} left`;

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

  async function handleCopyCode() {
    try {
      await copyToClipboard(displayCode);
      setCopyFeedback("copied");
      window.setTimeout(() => setCopyFeedback("idle"), 1800);
    } catch {
      setCopyFeedback("error");
      window.setTimeout(() => setCopyFeedback("idle"), 2400);
    }
  }

  async function handleShareInvite() {
    const inviteMessage = getInviteMessage(displayCode);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my Greed Deal game",
          text: inviteMessage,
        });
        setInviteFeedback("shared");
      } else {
        await copyToClipboard(inviteMessage);
        setInviteFeedback("copied");
      }
      window.setTimeout(() => setInviteFeedback("idle"), 2200);
    } catch (shareFailure) {
      if (shareFailure instanceof DOMException && shareFailure.name === "AbortError") {
        return;
      }
      setInviteFeedback("error");
      window.setTimeout(() => setInviteFeedback("idle"), 2400);
    }
  }

  return (
    <main className="board-page">
      <div className="board-shell">
        <section className="board-loading-state board-lobby-state" aria-live="polite">
          <div className="board-lobby-state__hero">
            <p className="board-loading-state__eyebrow">Game Lobby</p>
            <h1>{isHost ? "Your table" : "Waiting room"}</h1>
            <p className="board-lobby-state__helper">
              {playersNeeded > 0
                ? `Need ${playersNeeded === 1 ? "1 more player" : `${playersNeeded} more players`} to start.`
                : isHost
                  ? "Enough players are here. Start when ready."
                  : guestStatusCopy}
            </p>
          </div>

          <div className="board-lobby-state__code-card" aria-label={`Game code ${displayCode}`}>
            <div className="board-lobby-state__code-copy">
              <span className="board-lobby-state__code-label">Game code</span>
              <strong>{displayCode}</strong>
              <span className="board-lobby-state__code-hint">Share this code with players joining from home.</span>
            </div>
            <div className="board-lobby-state__code-actions">
              <button
                type="button"
                className="board-lobby-state__copy-button"
                aria-label={`Copy game code ${displayCode}`}
                onClick={() => void handleCopyCode()}
              >
                <CopyIcon className="board-lobby-state__copy-icon" />
                <span>
                  {copyFeedback === "copied"
                    ? "Copied"
                    : copyFeedback === "error"
                      ? "Retry"
                      : "Copy code"}
                </span>
              </button>
              <button
                type="button"
                className="board-lobby-state__copy-button board-lobby-state__copy-button--secondary"
                onClick={() => void handleShareInvite()}
              >
                {inviteFeedback === "shared"
                  ? "Shared"
                  : inviteFeedback === "copied"
                    ? "Invite copied"
                    : inviteFeedback === "error"
                      ? "Retry invite"
                      : "Share invite"}
              </button>
            </div>
          </div>

          <div
            className="board-lobby-state__status-band"
            aria-label={`${filledSeatLabel} players seated`}
          >
            <div className="board-lobby-state__status-copy">
              <span className="board-lobby-state__status-label">Players</span>
              <strong>{filledSeatLabel}</strong>
              <span>{seatSummary}</span>
            </div>
            <div className="board-lobby-state__seat-dots" aria-hidden="true">
              {Array.from({ length: MAX_LOBBY_PLAYERS }, (_, index) => (
                <span
                  key={index}
                  className={`board-lobby-state__seat-dot${
                    index < players.length ? " board-lobby-state__seat-dot--filled" : ""
                  }`}
                />
              ))}
            </div>
            <span className="board-lobby-state__status-text">{lobbyStatus}</span>
          </div>

          <div className="board-lobby-state__players" aria-label="Players in lobby">
            {players.map((player, index) => {
              const isCurrentPlayer = player === playerId;
              const isPlayerHost = player === hostId;

              return (
                <article
                  key={player}
                  className={`board-lobby-state__player-card${
                    isCurrentPlayer ? " board-lobby-state__player-card--you" : ""
                  }`}
                >
                  <div className="board-lobby-state__player-avatar" aria-hidden="true">
                    {index + 1}
                  </div>
                  <div className="board-lobby-state__player-copy">
                    <strong>{player}</strong>
                    <span>
                      {[isPlayerHost ? "Host" : "Player", isCurrentPlayer ? "You" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </article>
              );
            })}
            {Array.from({ length: emptySeats }, (_, index) => (
              <article
                key={`empty-${index}`}
                className="board-lobby-state__player-card board-lobby-state__player-card--empty"
              >
                <div className="board-lobby-state__player-avatar" aria-hidden="true">
                  {players.length + index + 1}
                </div>
                <div className="board-lobby-state__player-copy">
                  <strong>Open seat</strong>
                  <span>Waiting for player</span>
                </div>
              </article>
            ))}
          </div>

          {error || startError ? (
            <p className="board-loading-state__error-copy">{startError ?? error}</p>
          ) : null}
          {isHost ? (
            <div className="board-lobby-state__actions">
              <button
                type="button"
                className={`board-primary-button${players.length < 2 ? " board-primary-button--muted" : ""}`}
                disabled={players.length < MIN_PLAYERS_TO_START || isStarting}
                onClick={() => void handleStart()}
              >
                {isStarting
                  ? "Starting..."
                  : players.length < MIN_PLAYERS_TO_START
                    ? "Need 2 Players"
                    : "Start Match"}
              </button>
              <p className="board-lobby-state__helper">
                {players.length < MIN_PLAYERS_TO_START
                  ? "Once one more player joins, you can launch the round."
                  : isLobbyFull
                    ? "All four seats are filled. Start when the table is ready."
                    : `Start now, or wait for ${seatsRemaining === 1 ? "1 more player" : `${seatsRemaining} more players`}.`}
              </p>
            </div>
          ) : (
            <p className="board-lobby-state__helper">{guestStatusCopy}</p>
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
        gameCode={session.view.game_code ?? null}
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
      surrenderAnnouncements={session.surrenderAnnouncements}
      discardTopCardId={session.boardView.discardTopCatalogCardId}
      drawCount={session.boardView.deckCount}
      blockingState={session.boardView.blockingState}
      onSubmitAction={session.submitAction}
      onSubmitPendingResponse={session.submitPendingResponse}
      onSubmitPayment={session.submitPayment}
      onSubmitDiscard={session.submitDiscard}
      onConfirmEndTurn={session.endTurn}
      onSurrenderGame={session.surrenderGame}
      onDismissSurrenderAnnouncement={session.dismissSurrenderAnnouncement}
    />
  );
}
