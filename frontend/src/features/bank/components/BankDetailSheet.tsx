import { useEffect } from "react";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import type { LocalBankCard } from "../../board/model/localPlayer";
import { getBankSummaryData } from "../model/bankSummary";

type BankDetailSheetProps = {
  cards: LocalBankCard[];
  total: string;
  onClose: () => void;
};

export function BankDetailSheet({ cards, total, onClose }: BankDetailSheetProps) {
  const summary = getBankSummaryData(cards);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="bank-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className="bank-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Bank details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bank-detail-sheet__header">
          <div>
            <p className="bank-detail-sheet__eyebrow">Bank</p>
            <h2>{total}</h2>
          </div>

          <button
            type="button"
            className="bank-detail-sheet__close"
            onClick={onClose}
            aria-label="Close bank details"
          >
            X
          </button>
        </div>

        <div className="bank-detail-sheet__summary">
          <div className="bank-detail-sheet__stat">
            <span>Total</span>
            <strong>{total}</strong>
          </div>
          <div className="bank-detail-sheet__stat">
            <span>Cards</span>
            <strong>{cards.length}</strong>
          </div>
          <div className="bank-detail-sheet__stat">
            <span>Money</span>
            <strong>{summary.moneyCount}</strong>
          </div>
          <div className="bank-detail-sheet__stat">
            <span>Action / Rent</span>
            <strong>{summary.actionCount}</strong>
          </div>
        </div>

        <section className="bank-detail-sheet__section" aria-label="Bank cards">
          <div className="bank-detail-sheet__section-header">
            <h3>Cards</h3>
            <p>${summary.totalAmount}M face value</p>
          </div>

          <div className="bank-detail-sheet__cards">
            {summary.renderCards.map((card) => (
              <div key={card.id} className="bank-detail-sheet__card">
                <ScaledMonopolyCard
                  card={card}
                  size="md"
                  scale={0.58}
                  className="bank-detail-sheet__scaled-card"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bank-detail-sheet__section" aria-label="Card values">
          <div className="bank-detail-sheet__section-header">
            <h3>Value Breakdown</h3>
          </div>

          <div className="bank-detail-sheet__value-list">
            {summary.cardValueLabels.map((valueLabel) => (
              <span key={valueLabel} className="bank-detail-sheet__value-chip">
                {valueLabel}
              </span>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
