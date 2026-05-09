import { type FormEvent, useMemo, useState } from "react";
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

function openGameRoute(gameId: string) {
  const params = new URLSearchParams({ gameId });
  window.location.assign(`/game?${params.toString()}`);
}

type HomeFlow = "options" | "start" | "join";

export function HomeScreen() {
  const [flow, setFlow] = useState<HomeFlow>("options");
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const featuredCards = useMemo(() => heroCards, []);

  function openFlow(nextFlow: Exclude<HomeFlow, "options">) {
    setFlow(nextFlow);
    setStatusMessage(null);
  }

  function returnToOptions() {
    setFlow("options");
    setStatusMessage(null);
  }

  async function handleCreateGame(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const requestedPlayerName = playerName.trim();
    if (!requestedPlayerName) {
      setStatusMessage("Enter your name to create a game.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Creating lobby...");
    try {
      const game = await backendClient.createGame(requestedPlayerName);
      openGameRoute(game.game_id);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not create game.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinGame(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const requestedPlayerName = playerName.trim();
    const requestedGameCode = gameCode.trim().toUpperCase();
    if (!requestedPlayerName || !requestedGameCode) {
      setStatusMessage("Enter your name and a game code to join.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Joining lobby...");
    try {
      const response = await backendClient.joinGameByCode({
        game_code: requestedGameCode,
        player_name: requestedPlayerName,
      });
      openGameRoute(response.player_view.game_id);
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

        {flow === "options" ? (
          <section className="home-panel home-choice-panel" aria-label="Choose game">
            <h2 className="home-panel-title">Choose Game</h2>
            <div className="home-choice-list">
              <button
                className="home-choice home-choice--start"
                type="button"
                onClick={() => openFlow("start")}
              >
                <span className="home-choice__icon" aria-hidden="true">+</span>
                <span className="home-choice__label">Start Game</span>
                <span className="home-choice__arrow" aria-hidden="true">&gt;</span>
              </button>

              <button
                className="home-choice home-choice--join"
                type="button"
                onClick={() => openFlow("join")}
              >
                <span className="home-choice__icon" aria-hidden="true">#</span>
                <span className="home-choice__label">Join Game</span>
                <span className="home-choice__arrow" aria-hidden="true">&gt;</span>
              </button>
            </div>
          </section>
        ) : null}

        {flow === "start" ? (
          <section className="home-panel home-flow-panel" aria-label="Start game">
            <div className="home-flow-panel__header">
              <button
                className="home-back-button"
                type="button"
                onClick={returnToOptions}
              >
                &lt;- Options
              </button>
              <h2 className="home-panel-title">Start Game</h2>
            </div>

            <form className="home-form" onSubmit={(event) => void handleCreateGame(event)}>
              <label className="home-field">
                <span>Name</span>
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </label>

              {statusMessage ? (
                <p className="home-status" aria-live="polite">{statusMessage}</p>
              ) : null}

              <button
                className="home-cta home-cta--olive"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Working..." : "Host Match"}
              </button>
            </form>
          </section>
        ) : null}

        {flow === "join" ? (
          <section className="home-panel home-flow-panel" aria-label="Join game">
            <div className="home-flow-panel__header">
              <button
                className="home-back-button"
                type="button"
                onClick={returnToOptions}
              >
                &lt;- Options
              </button>
              <h2 className="home-panel-title">Join Game</h2>
            </div>

            <form className="home-form" onSubmit={(event) => void handleJoinGame(event)}>
              <label className="home-field">
                <span>Name</span>
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </label>

              <label className="home-field">
                <span>Game Code</span>
                <input
                  value={gameCode}
                  maxLength={5}
                  autoCapitalize="characters"
                  onChange={(event) => setGameCode(event.target.value.toUpperCase())}
                  placeholder="ABCDE"
                />
              </label>

              {statusMessage ? (
                <p className="home-status" aria-live="polite">{statusMessage}</p>
              ) : null}

              <button
                className="home-cta home-cta--blue"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Working..." : "Join Match"}
              </button>
            </form>
          </section>
        ) : null}

        <section className="home-utility" aria-label="Quick actions">
          <button className="home-utility__button home-utility__button--dark" type="button">
            How to Play
          </button>
        </section>
      </div>
    </main>
  );
}
