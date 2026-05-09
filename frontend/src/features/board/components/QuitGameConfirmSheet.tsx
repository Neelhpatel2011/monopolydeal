import { useState } from "react";

type QuitGameConfirmSheetProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function QuitGameConfirmSheet({
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
}: QuitGameConfirmSheetProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleConfirm() {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    try {
      await onConfirm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not leave the match.",
      );
    }
  }

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
        aria-labelledby="quit-game-confirm-title"
        aria-describedby="quit-game-confirm-detail"
      >
        <p className="end-turn-confirm-sheet__eyebrow">Quit Match</p>
        <h2 id="quit-game-confirm-title">Leave this match?</h2>
        <p id="quit-game-confirm-detail">
          Leaving now counts as a surrender. You will return to the home page,
          and the remaining players will be told that you surrendered.
        </p>

        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}

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
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? "Quitting..." : "Quit Match and Forfeit"}
          </button>
        </div>
      </section>
    </div>
  );
}
