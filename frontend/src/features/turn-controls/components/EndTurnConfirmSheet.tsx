import { buildEndTurnConfirmCopy } from "../model/endTurnFlow";

type EndTurnConfirmSheetProps = {
  actionsLeft: number;
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EndTurnConfirmSheet({
  actionsLeft,
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
}: EndTurnConfirmSheetProps) {
  if (!isOpen) {
    return null;
  }

  const copy = buildEndTurnConfirmCopy(actionsLeft);

  return (
    <div className="end-turn-confirm-sheet" role="presentation">
      <button
        className="end-turn-confirm-sheet__backdrop"
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={isSubmitting ? undefined : onCancel}
      />

      <section
        className="end-turn-confirm-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-turn-confirm-title"
        aria-describedby="end-turn-confirm-detail"
      >
        <p className="end-turn-confirm-sheet__eyebrow">{copy.eyebrow}</p>
        <h2 id="end-turn-confirm-title">{copy.title}</h2>
        <p id="end-turn-confirm-detail">{copy.detail}</p>

        <div className="end-turn-confirm-sheet__actions">
          <button
            className="secondary-pill-button end-turn-confirm-sheet__secondary"
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Keep Playing
          </button>
          <button
            className="end-turn-confirm-sheet__primary"
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Ending..." : "Confirm End Turn"}
          </button>
        </div>
      </section>
    </div>
  );
}
