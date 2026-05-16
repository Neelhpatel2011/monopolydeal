import type { OutstandingEndTurnPayment } from "../model/endTurnFlow";
import { buildEndTurnConfirmCopy } from "../model/endTurnFlow";

type EndTurnConfirmSheetProps = {
  actionsLeft: number;
  isOpen: boolean;
  isSubmitting: boolean;
  outstandingPayments?: OutstandingEndTurnPayment[];
  errorMessage?: string | null;
  errorDetail?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EndTurnConfirmSheet({
  actionsLeft,
  isOpen,
  isSubmitting,
  outstandingPayments = [],
  errorMessage = null,
  errorDetail = null,
  onCancel,
  onConfirm,
}: EndTurnConfirmSheetProps) {
  if (!isOpen) {
    return null;
  }

  const copy = buildEndTurnConfirmCopy(actionsLeft);
  const hasOutstandingPayments = outstandingPayments.length > 0;

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

        {hasOutstandingPayments ? (
          <div className="end-turn-confirm-sheet__blocking">
            <p className="end-turn-confirm-sheet__blocking-title">
              You are still waiting on payment before this turn can end.
            </p>
            <ul className="end-turn-confirm-sheet__blocking-list">
              {outstandingPayments.map((payment) => (
                <li key={payment.playerName}>
                  <span>{payment.playerName}</span>
                  <strong>{payment.statusLabel}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="board-modal-sheet__alert">
            {errorMessage}
            {errorDetail ? ` ${errorDetail}` : ""}
          </p>
        ) : null}

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
            disabled={isSubmitting || hasOutstandingPayments}
            onClick={onConfirm}
          >
            {isSubmitting
              ? "Ending..."
              : hasOutstandingPayments
                ? "Waiting on Payment"
                : "Confirm End Turn"}
          </button>
        </div>
      </section>
    </div>
  );
}
