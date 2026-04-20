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
  return (
    <div className={`action-hint-bar action-hint-bar--${tone}`}>
      <div className="action-hint-bar__copy">
        <span className="action-hint-bar__eyebrow">{eyebrow}</span>
        <p className="action-hint-bar__title">{title}</p>
        <p className="action-hint-bar__detail">{detail}</p>
      </div>
      <button className="action-hint-bar__info" type="button" aria-label="About turn actions">
        i
      </button>
    </div>
  );
}
