import type { OpponentDetail } from "../model/opponentExpansion";

type OpponentQuickSwitchProps = {
  activeOpponentId: string;
  opponents: OpponentDetail[];
  onSelectOpponent: (opponentId: string) => void;
};

export function OpponentQuickSwitch({
  activeOpponentId,
  opponents,
  onSelectOpponent,
}: OpponentQuickSwitchProps) {
  return (
    <section className="opponent-quick-switch" aria-label="Quick switch opponents">
      <div className="opponent-quick-switch__header">
        <h3>Switch</h3>
      </div>

      <div className="opponent-quick-switch__list" role="tablist" aria-label="Opponent quick switch">
        {opponents.map((opponent) => {
          const isActive = opponent.id === activeOpponentId;

          return (
            <button
              key={opponent.id}
              className={`opponent-quick-switch__item${isActive ? " opponent-quick-switch__item--active" : ""}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`opponent-detail-sheet-${opponent.id}`}
              onClick={() => onSelectOpponent(opponent.id)}
            >
              <span className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
                {opponent.avatarInitial}
              </span>
              <span className="opponent-quick-switch__name">{opponent.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
