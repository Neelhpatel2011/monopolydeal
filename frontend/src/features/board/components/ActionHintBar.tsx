type ActionHintBarProps = {
  eyebrow: string;
  title: string;
  detail: string;
  tone?: "default" | "active" | "targeting" | "invalid";
};

export function ActionHintBar({
  eyebrow,
  title,
  detail,
  tone = "default",
}: ActionHintBarProps) {
  const accessibleLabel = [eyebrow, title, detail].filter(Boolean).join(". ");

  return (
    <div className={`action-hint-bar action-hint-bar--compact action-hint-bar--${tone}`}>
      <button
        className="action-hint-bar__info"
        type="button"
        aria-label={accessibleLabel || "About turn actions"}
      >
        i
      </button>
    </div>
  );
}
