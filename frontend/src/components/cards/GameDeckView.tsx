import cards from "../../data/monopolyDealCards.json";
import type { CardType } from "../../types/monopolyDeal";
import { MonopolyDealCard } from "./MonopolyDealCard";
import { groupCardsByType, parseMonopolyDealCatalog } from "./catalog";

const orderedSections: CardType[] = ["action", "rent", "property", "wild", "money"];

const groupedCards = groupCardsByType(parseMonopolyDealCatalog(cards), orderedSections);

function formatSectionTitle(type: CardType) {
  switch (type) {
    case "rent":
      return "Rent Cards";
    case "property":
      return "Property Cards";
    case "wild":
      return "Wild Cards";
    case "money":
      return "Money Cards";
    case "action":
    default:
      return "Action Cards";
  }
}

export default function GameDeckView() {
  return (
    <main className="card-catalog-page">
      <div className="card-catalog-shell">
        <header className="card-catalog-hero">
          <h1>Monopoly Deal Card System Preview</h1>
          <p className="card-catalog-hero__detail">
            Combined action, rent, property, wild, and money card previews in one mobile-first canvas.
          </p>
        </header>

        {groupedCards.map((section) => (
          <section key={section.type} className="card-catalog-section">
            <div className="card-catalog-section__header">
              <div>
                <h2>{formatSectionTitle(section.type)}</h2>
              </div>
            </div>

            <div className="card-catalog-section__rail" role="list" aria-label={formatSectionTitle(section.type)}>
              {section.cards.map((card) => (
                <div key={card.id} className="card-catalog-section__item" role="listitem">
                  <MonopolyDealCard card={card} size="md" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
