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

const howToBasics = [
  {
    title: "Win with 3 complete property sets",
    copy: "Collect full color groups in front of you. For example, two dark blue properties make one complete dark blue set.",
  },
  {
    title: "Draw 2 cards when your turn starts",
    copy: "The app handles the draw for you. Look at your hand, then decide what helps your board most.",
  },
  {
    title: "Play up to 3 cards",
    copy: "A play can be adding a property, putting money in your bank, or using an action card. You can also play fewer than 3 and end your turn.",
  },
];

const howToCardTypes = [
  {
    title: "Properties",
    copy: "Place these in your property area to build sets. Example: play Boardwalk, then add Park Place later to complete dark blue.",
  },
  {
    title: "Money and banked cards",
    copy: "Put money cards, or bankable action cards, into your bank. Example: bank a $3M card so you can pay rent later.",
  },
  {
    title: "Rent cards",
    copy: "Charge players for one of your property colors. Example: if you own red properties, a red/yellow rent card can ask for red rent.",
  },
  {
    title: "Action cards",
    copy: "These do special moves like drawing extra cards, collecting money, or stealing properties. Follow the prompt after you choose one.",
  },
  {
    title: "Just Say No",
    copy: "Use this to block an action aimed at you. Example: if someone tries to steal your property, Just Say No cancels it.",
  },
];

function HowToPlayGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="home-how-to" role="presentation" onClick={onClose}>
      <section
        className="home-how-to__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-how-to-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="home-how-to__header">
          <div>
            <p className="home-how-to__eyebrow">New Player Guide</p>
            <h2 id="home-how-to-title">How to Play</h2>
          </div>
          <button
            className="home-how-to__close"
            type="button"
            onClick={onClose}
            aria-label="Close how to play guide"
          >
            ×
          </button>
        </div>

        <div className="home-how-to__intro">
          <strong>Short version:</strong> build 3 full property sets before everyone else.
        </div>

        <div className="home-how-to__section">
          <h3>On every turn</h3>
          <ol className="home-how-to__steps">
            {howToBasics.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="home-how-to__section">
          <h3>What the cards do</h3>
          <div className="home-how-to__cards">
            {howToCardTypes.map((item) => (
              <article key={item.title} className="home-how-to__card-type">
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="home-how-to__section home-how-to__tip">
          <h3>Easy beginner plan</h3>
          <p>
            First, play properties so you can start building sets. Next, keep some money in your bank
            so rent does not force you to give away properties. Then use rent and action cards to slow
            opponents down while you finish your third set.
          </p>
        </div>
      </section>
    </div>
  );
}

export function HomeScreen() {
  const [flow, setFlow] = useState<HomeFlow>("options");
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
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
          <button
            className="home-utility__button home-utility__button--dark"
            type="button"
            onClick={() => setIsHowToOpen(true)}
          >
            How to Play
          </button>
        </section>
      </div>

      {isHowToOpen ? <HowToPlayGuide onClose={() => setIsHowToOpen(false)} /> : null}
    </main>
  );
}
