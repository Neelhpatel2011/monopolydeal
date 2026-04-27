import { useMemo, useState } from "react";
import rawCatalog from "../../../data/monopolyDealCards.json";
import { parseMonopolyDealCatalog } from "../../../components/cards/catalog";
import { MonopolyDealCard } from "../../../components/cards/MonopolyDealCard";
import { backendClient } from "../../../integration/backend/client";

const catalog = parseMonopolyDealCatalog(rawCatalog);

const heroCards = [
  catalog.find((card) => card.id === "action-deal-breaker"),
  catalog.find((card) => card.id === "property-red"),
  catalog.find((card) => card.id === "rent-wild"),
].filter(Boolean);

function openGameRoute(gameId: string, playerId: string) {
  const params = new URLSearchParams({ gameId, playerId });
  window.location.assign(`/game?${params.toString()}`);
}

function openDemoRoute() {
  window.location.assign("/game?demo=1");
}

export function HomeScreen() {
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [gameId, setGameId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const featuredCards = useMemo(() => heroCards, []);

  async function handleCreateGame() {
    const playerName = hostName.trim();
    if (!playerName) {
      setStatusMessage("Enter your name to create a game.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Creating lobby...");
    try {
      const game = await backendClient.createGame(playerName);
      openGameRoute(game.game_id, game.player_ids[0] ?? playerName);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not create game.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinGame() {
    const playerName = joinName.trim();
    const requestedGameId = gameId.trim();
    if (!playerName || !requestedGameId) {
      setStatusMessage("Enter your name and a game ID to join.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Joining lobby...");
    try {
      const response = await backendClient.joinGame(requestedGameId, playerName);
      openGameRoute(response.player_view.game_id, response.player_id);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not join game.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="home-screen">
      <div className="home-shell">
        <header className="home-hero">
          <div className="home-hero__masthead">
            <span className="home-hero__tag">Online Property Trading Card Game</span>
            <h1 className="home-hero__logo">
              Deal<span>//</span>Riot
            </h1>
            <p className="home-hero__subhead">Steal. Stack. Counter. Flip the table.</p>
          </div>

          <div className="home-hero__card-line" aria-hidden="true">
            {featuredCards.map((card, index) =>
              card ? (
                <div
                  key={card.id}
                  className={`home-hero__card home-hero__card--${index + 1}`}
                >
                  <MonopolyDealCard card={card} size="sm" />
                </div>
              ) : null,
            )}
          </div>
        </header>

        <section className="home-actions" aria-label="Lobby actions">
          <article className="home-panel home-panel--olive">
            <div className="home-panel__header">
              <span className="home-panel__eyebrow">Create Game</span>
              <h2>Start a table</h2>
            </div>

            <label className="home-field">
              <span>Name</span>
              <input
                value={hostName}
                onChange={(event) => setHostName(event.target.value)}
                placeholder="Your name"
              />
            </label>

            <button
              className="home-cta home-cta--olive"
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleCreateGame()}
            >
              {isSubmitting ? "Working..." : "Host Match"}
            </button>
          </article>

          <article className="home-panel home-panel--blue">
            <div className="home-panel__header">
              <span className="home-panel__eyebrow">Join Game</span>
              <h2>Crash the party</h2>
            </div>

            <label className="home-field">
              <span>Name</span>
              <input
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="Your name"
              />
            </label>

            <label className="home-field">
              <span>Game ID</span>
              <input
                value={gameId}
                onChange={(event) => setGameId(event.target.value)}
                placeholder="Game ID"
              />
            </label>

            <button
              className="home-cta home-cta--blue"
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleJoinGame()}
            >
              {isSubmitting ? "Working..." : "Join Match"}
            </button>
          </article>
        </section>

        {statusMessage ? (
          <p className="home-status" aria-live="polite">{statusMessage}</p>
        ) : null}

        <section className="home-utility" aria-label="Quick actions">
          <button className="home-utility__button home-utility__button--dark" type="button">
            How to Play
          </button>
          <button className="home-utility__button home-utility__button--gold" type="button" onClick={openDemoRoute}>
            Demo Match
          </button>
          <button className="home-utility__button home-utility__button--dark" type="button" onClick={openDemoRoute}>
            Enter Arena
          </button>
        </section>
      </div>
    </main>
  );
}
