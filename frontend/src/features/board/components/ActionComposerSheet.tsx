import { useMemo, useState } from "react";
import type { LocalHandCard } from "../model/localPlayer";
import type { DraftActionIntent } from "../model/interaction-types";
import { applyChosenValue, buildActionRequestFromIntent, getComposerOptions } from "../model/backendActionBridge";
import { formatActionFieldLabel } from "../model/card-intents";

type ActionComposerSheetProps = {
  playerId: string;
  card: LocalHandCard;
  intent: DraftActionIntent;
  onClose: () => void;
  onSubmit: (intent: DraftActionIntent) => Promise<void>;
};

export function ActionComposerSheet({
  playerId,
  card,
  intent,
  onClose,
  onSubmit,
}: ActionComposerSheetProps) {
  const [draftIntent, setDraftIntent] = useState(intent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstMissingField = draftIntent.missing[0] ?? null;
  const options = useMemo(
    () =>
      firstMissingField
        ? getComposerOptions({
            card,
            field: firstMissingField,
            chosen: draftIntent.chosen,
          })
        : [],
    [card, draftIntent.chosen, firstMissingField],
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onSubmit(draftIntent);
    } finally {
      setIsSubmitting(false);
    }
  }

  void playerId;
  void buildActionRequestFromIntent;

  return (
    <div className="board-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="board-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${card.label} options`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Complete Play</p>
            <h2>{card.label}</h2>
          </div>
          <button type="button" className="board-modal-sheet__close" onClick={onClose}>
            X
          </button>
        </div>

        {firstMissingField ? (
          <div className="board-modal-sheet__body">
            <p className="board-modal-sheet__copy">
              Choose {formatActionFieldLabel(firstMissingField)}.
            </p>
            <div className="board-option-list">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="board-option-list__item"
                  onClick={() =>
                    setDraftIntent((current) =>
                      applyChosenValue(current, firstMissingField, option.value),
                    )
                  }
                >
                  <strong>{option.label}</strong>
                  {option.detail ? <span>{option.detail}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="board-modal-sheet__body">
            <p className="board-modal-sheet__copy">Ready to submit this play.</p>
          </div>
        )}

        <div className="board-modal-sheet__footer">
          <button type="button" className="board-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="board-primary-button"
            disabled={draftIntent.missing.length > 0 || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Submitting..." : "Confirm"}
          </button>
        </div>
      </section>
    </div>
  );
}
