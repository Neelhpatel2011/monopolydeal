type PendingPromptSheetProps = {
  prompt: string;
  isSubmitting: boolean;
  onAccept: () => Promise<void>;
  onJustSayNo: () => Promise<void>;
};

export function PendingPromptSheet({
  prompt,
  isSubmitting,
  onAccept,
  onJustSayNo,
}: PendingPromptSheetProps) {
  return (
    <div className="board-modal-overlay" role="presentation">
      <section className="board-modal-sheet" role="dialog" aria-modal="true" aria-label="Pending prompt">
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Pending Prompt</p>
            <h2>{prompt}</h2>
          </div>
        </div>
        <div className="board-modal-sheet__footer">
          <button type="button" className="board-secondary-button" disabled={isSubmitting} onClick={() => void onAccept()}>
            Accept
          </button>
          <button type="button" className="board-primary-button" disabled={isSubmitting} onClick={() => void onJustSayNo()}>
            Just Say No
          </button>
        </div>
      </section>
    </div>
  );
}
