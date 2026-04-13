import type { CSSProperties } from "react";
import type { LocalBankCard } from "../../board/model/localPlayer";

type BankStripProps = {
  cards: LocalBankCard[];
  total: string;
};

export function BankStrip({ cards, total }: BankStripProps) {
  return (
    <section className="bank-strip" aria-label="Banked cards">
      <div className="bank-strip__header">
        <div>
          <p className="bank-strip__eyebrow">Bank</p>
          <h3>{total}</h3>
        </div>
        <p className="bank-strip__summary">{cards.length} cards</p>
      </div>

      <div className="bank-strip__cards">
        {cards.map((card, index) => (
          <article
            key={card.id}
            className={`bank-note bank-note--${card.tone}`}
            aria-label={`${card.amount} ${card.label}`}
            style={{ "--bank-index": index } as CSSProperties}
          >
            <span className="bank-note__corner">{card.amount}</span>
            <span className="bank-note__label">{card.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
