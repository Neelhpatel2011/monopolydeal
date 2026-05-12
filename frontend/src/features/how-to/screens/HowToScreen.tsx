const turnSteps = [
  {
    title: "Start with your hand",
    copy: "Your cards live in the bottom tray. Tap a card to select it, drag it toward the board to play it, or press and hold to enlarge it and read what it does.",
  },
  {
    title: "Build property sets",
    copy: "Properties go into your tableau. Complete three color sets before everyone else to win the match.",
  },
  {
    title: "Keep a bank",
    copy: "Money cards and bankable action cards can be stored in your bank. A healthy bank protects your properties when rent comes due.",
  },
  {
    title: "Play up to three cards",
    copy: "A turn can include properties, bank cards, rent, and actions. The turn controls show how many plays you have left.",
  },
];

const cardTypes = [
  {
    title: "Properties",
    copy: "Place these in front of you to build color groups. A complete color group counts toward the three sets needed to win.",
  },
  {
    title: "Wild properties",
    copy: "Wilds can represent more than one color. Use them to finish sets faster, then adjust their color when the UI offers a choice.",
  },
  {
    title: "Rent cards",
    copy: "Rent charges another player based on a property color you own. Pick the matching set and target when prompted.",
  },
  {
    title: "Action cards",
    copy: "Actions draw cards, collect money, steal properties, or block moves. Follow the composer sheet after you choose one.",
  },
  {
    title: "Money cards",
    copy: "Money is safest in your bank. Banked cards are used to pay opponents before your properties are at risk.",
  },
  {
    title: "Just Say No",
    copy: "This action cancels an opponent's action against you when the game prompts you to respond.",
  },
];

const uiTour = [
  {
    label: "Opponent rail",
    copy: "The top summaries show each opponent's bank, hand count, and property progress. Tap a player for details when you need them.",
  },
  {
    label: "Center stage",
    copy: "The middle of the board shows the draw pile, discard pile, active prompts, and highlighted drop targets while you drag cards.",
  },
  {
    label: "Your tableau",
    copy: "Your property sets sit above the hand. Complete sets are visually emphasized so you can track your win condition quickly.",
  },
  {
    label: "Hand tray",
    copy: "Your playable cards stay along the bottom for thumb reach. Press and hold a card to preview it without committing to a play.",
  },
  {
    label: "Turn controls",
    copy: "End turn lives away from the hand so you do not hit it by accident while dragging cards. Use it when your turn plan is done.",
  },
];

function goHome() {
  window.location.assign("/");
}

function goGame() {
  window.location.assign("/game?demo=1");
}

export function HowToScreen() {
  return (
    <main className="how-to-screen">
      <div className="how-to-shell">
        <header className="how-to-hero">
          <button className="how-to-back" type="button" onClick={goHome}>
            &lt;- Home
          </button>
          <div>
            <p className="how-to-eyebrow">New Player Guide</p>
            <h1>How to Play Deal//Riot</h1>
            <p>
              Build three complete property sets, keep enough cash to survive rent, and use action
              cards at the right moment to disrupt everyone else.
            </p>
          </div>
        </header>

        <section className="how-to-panel how-to-panel--goal" aria-labelledby="how-to-goal">
          <p className="how-to-kicker">Baseline goal</p>
          <h2 id="how-to-goal">Win by completing 3 property sets</h2>
          <p>
            A complete set is a full color group in your tableau. Dark blue needs two cards, many
            other colors need three, and some utility or railroad groups have their own sizes. Wilds
            can help finish a group when they match that color.
          </p>
        </section>

        <section className="how-to-panel" aria-labelledby="how-to-turn-loop">
          <div className="how-to-section-heading">
            <p className="how-to-kicker">Turn loop</p>
            <h2 id="how-to-turn-loop">What to do on your turn</h2>
          </div>
          <ol className="how-to-steps">
            {turnSteps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.copy}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="how-to-panel" aria-labelledby="how-to-card-types">
          <div className="how-to-section-heading">
            <p className="how-to-kicker">Cards</p>
            <h2 id="how-to-card-types">What each card family is for</h2>
          </div>
          <div className="how-to-card-grid">
            {cardTypes.map((type) => (
              <article key={type.title} className="how-to-card-type">
                <h3>{type.title}</h3>
                <p>{type.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-to-panel" aria-labelledby="how-to-ui-tour">
          <div className="how-to-section-heading">
            <p className="how-to-kicker">UI walkthrough</p>
            <h2 id="how-to-ui-tour">Reading the game screen</h2>
          </div>
          <div className="how-to-ui-map" aria-label="Board UI areas">
            {uiTour.map((item) => (
              <article key={item.label} className="how-to-ui-map__item">
                <span>{item.label}</span>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-to-panel how-to-panel--strategy" aria-labelledby="how-to-strategy">
          <p className="how-to-kicker">Beginner plan</p>
          <h2 id="how-to-strategy">A simple first strategy</h2>
          <p>
            Prioritize playing properties early, then bank enough value to absorb rent. Once you
            have two nearly complete sets, use rent and action cards to slow opponents down while you
            finish your third set.
          </p>
          <div className="how-to-actions">
            <button className="how-to-action how-to-action--primary" type="button" onClick={goHome}>
              Start or Join a Game
            </button>
            <button className="how-to-action" type="button" onClick={goGame}>
              Open Demo Board
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
