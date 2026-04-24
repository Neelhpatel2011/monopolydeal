import { useMemo, useState } from "react";
import type { LocalHandCard } from "../model/localPlayer";

type DiscardFlowSheetProps = {
  requiredCount: number;
  cards: LocalHandCard[];
  onSubmit: (cardIds: string[]) => Promise<unknown>;
};

export function DiscardFlowSheet({ requiredCount, cards, onSubmit }: DiscardFlowSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedCards = useMemo(
    () =>
      selectedIds
        .map((id) => cards.find((card) => card.id === id))
        .filter((card): card is LocalHandCard => Boolean(card))
        .map((card) => card.backendCardId),
    [cards, selectedIds],
  );

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
                  onChange={() =>
                    setSelectedIds((current) =>
                      checked ? current.filter((id) => id !== card.id) : [...current, card.id],
                    )
                  }
                />
                <span>{card.label}</span>
              </label>
            );
          })}
        </div>
        <div className="board-modal-sheet__footer">
          <button
            type="button"
            className="board-primary-button"
            disabled={selectedIds.length !== requiredCount}
            onClick={() => void onSubmit(selectedCards)}
          >
            Discard
          </button>
        </div>
      </section>
    </div>
  );
}
