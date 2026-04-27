import { useState } from "react";

type PendingPromptSheetProps = {
  prompt: string;
  sourcePlayer: string;
  cardName: string;
  chargeAmountLabel?: string | null;
  canJustSayNo: boolean;
  isSubmitting: boolean;
  onAccept: () => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
  onJustSayNo: () => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
};

export function PendingPromptSheet({
  prompt,
  sourcePlayer,
  cardName,
  chargeAmountLabel,
  canJustSayNo,
  isSubmitting,
  onAccept,
  onJustSayNo,
}: PendingPromptSheetProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAccept() {
    if (isSubmitting) {
      return;
    }
    setErrorMessage(null);
    const result = await onAccept();
    if (result.status === "error") {
      setErrorMessage(result.message ?? "That response could not be submitted.");
    }
  }

  async function handleJustSayNo() {
    if (isSubmitting) {
      return;
    }
    if (!canJustSayNo) {
      setErrorMessage("You do not have a Just Say No card.");
      return;
    }

    setErrorMessage(null);
    const result = await onJustSayNo();
    if (result.status === "error") {
      setErrorMessage(result.message ?? "That response could not be submitted.");
    }
  }

  return (
    <div className="board-modal-overlay" role="presentation">
      <section className="board-modal-sheet" role="dialog" aria-modal="true" aria-label="Pending prompt">
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Pending Prompt</p>
            <h2>{cardName}</h2>
          </div>
        </div>
        <div className="board-modal-sheet__body">
          <p className="board-modal-sheet__copy">
            {sourcePlayer} played {cardName}.
          </p>
          {chargeAmountLabel ? (
            <div className="pending-prompt-sheet__charge">
              <span className="pending-prompt-sheet__charge-label">Charge</span>
              <strong className="pending-prompt-sheet__charge-amount">
                {chargeAmountLabel}
              </strong>
              <p className="board-modal-sheet__meta">
                If you accept, you will be charged {chargeAmountLabel}.
              </p>
            </div>
          ) : null}
          <p className="board-modal-sheet__copy">{prompt}</p>
        </div>
        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}
        <div className="board-modal-sheet__footer">
          <button type="button" className="board-secondary-button" disabled={isSubmitting} onClick={() => void handleAccept()}>
            Accept
          </button>
          <button
            type="button"
            className={`board-primary-button${!canJustSayNo ? " board-primary-button--muted" : ""}`}
            aria-disabled={!canJustSayNo || isSubmitting}
            onClick={() => void handleJustSayNo()}
          >
            Just Say No
          </button>
        </div>
      </section>
    </div>
  );
}
