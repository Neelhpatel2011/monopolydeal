import type { CSSProperties } from "react";
import type { LocalBankCard } from "../../board/model/localPlayer";
import { LOCAL_BANK_TARGET_ID } from "../../drag-targeting/model/target-preview";

type BankStripProps = {
  cards: LocalBankCard[];
  total: string;
  isTargetable?: boolean;
  isPreviewed?: boolean;
  isInvalid?: boolean;
};

export function BankStrip({
  cards,
  total,
  isTargetable = false,
  isPreviewed = false,
  isInvalid = false,
}: BankStripProps) {
  return (
    <section
      className={`bank-strip${isTargetable ? " bank-strip--targetable" : ""}${
        isPreviewed ? " bank-strip--previewed" : ""
      }${
        isInvalid ? " bank-strip--invalid" : ""
      }`}
      aria-label="Banked cards"
      data-board-target-id={LOCAL_BANK_TARGET_ID}
    >
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
