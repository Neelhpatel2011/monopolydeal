import { useMemo, useState } from "react";
import rawCatalog from "../../../data/monopolyDealCards.json";
import { parseMonopolyDealCatalog } from "../../../components/cards/catalog";
import { MonopolyDealCard } from "../../../components/cards/MonopolyDealCard";

const catalog = parseMonopolyDealCatalog(rawCatalog);

const heroCards = [
  catalog.find((card) => card.id === "action-deal-breaker"),
  catalog.find((card) => card.id === "property-red"),
  catalog.find((card) => card.id === "rent-wild"),
].filter(Boolean);

function openGameRoute() {
  window.location.pathname = "/game";
}

export function HomeScreen() {
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [gameId, setGameId] = useState("");
  const featuredCards = useMemo(() => heroCards, []);

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

            <button className="home-cta home-cta--olive" type="button" onClick={openGameRoute}>
              Host Match
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

            <button className="home-cta home-cta--blue" type="button" onClick={openGameRoute}>
              Join Match
            </button>
          </article>
        </section>

        <section className="home-utility" aria-label="Quick actions">
          <button className="home-utility__button home-utility__button--dark" type="button">
            How to Play
          </button>
          <button className="home-utility__button home-utility__button--gold" type="button" onClick={openGameRoute}>
            Quick Match
          </button>
          <button className="home-utility__button home-utility__button--dark" type="button" onClick={openGameRoute}>
            Enter Arena
          </button>
        </section>
      </div>
    </main>
  );
}
