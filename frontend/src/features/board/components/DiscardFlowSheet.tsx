import { useMemo, useState } from "react";
import type { LocalHandCard } from "../model/localPlayer";

type DiscardFlowSheetProps = {
  requiredCount: number;
  cards: LocalHandCard[];
  onSubmit: (cardIds: string[]) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
};

export function DiscardFlowSheet({ requiredCount, cards, onSubmit }: DiscardFlowSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedCards = useMemo(
    () =>
      selectedIds
        .map((id) => cards.find((card) => card.id === id))
        .filter((card): card is LocalHandCard => Boolean(card))
        .map((card) => card.backendCardId),
    [cards, selectedIds],
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onSubmit(selectedCards);
      if (result.status === "error") {
        setErrorMessage(result.message ?? "Discard could not be submitted.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="board-modal-overlay" role="presentation">
      <section className="board-modal-sheet" role="dialog" aria-modal="true" aria-label="Discard required">
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Discard Required</p>
            <h2>Choose {requiredCount} cards</h2>
          </div>
        </div>
        <div className="board-check-list">
          {cards.map((card) => {
            const checked = selectedIds.includes(card.id);
            return (
              <label key={card.id} className="board-check-list__item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setErrorMessage(null);
                    setSelectedIds((current) =>
                      checked ? current.filter((id) => id !== card.id) : [...current, card.id],
                    );
                  }}
                />
                <span>{card.label}</span>
              </label>
            );
          })}
        </div>
        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}
        <div className="board-modal-sheet__footer">
          <button
            type="button"
            className="board-primary-button"
            disabled={isSubmitting || selectedIds.length !== requiredCount}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Submitting..." : "Discard"}
          </button>
        </div>
      </section>
    </div>
  );
}
