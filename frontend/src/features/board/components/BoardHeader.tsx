type BoardHeaderProps = {
  roundLabel: string;
  actionsLeft: number;
};

export function BoardHeader({ roundLabel, actionsLeft }: BoardHeaderProps) {
  return (
    <header className="board-header">
      <button className="board-icon-button" type="button" aria-label="Open menu">
        <span className="board-icon-button__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div className="board-header__center">
        <h1>{roundLabel}</h1>
      </div>

      <div className="board-header__turn">
        <button className="end-turn-button" type="button">
          <span>End Turn</span>
          <span aria-hidden="true">&gt;</span>
        </button>
        <p>{actionsLeft} actions left</p>
      </div>
    </header>
  );
}
