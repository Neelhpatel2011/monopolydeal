import { TurnControlsDock } from "../../turn-controls/components/TurnControlsDock";
import type { EndTurnControlState } from "../../turn-controls/model/endTurnFlow";

type BoardHeaderProps = {
  roundLabel: string;
  turnControlState: EndTurnControlState;
  onRequestEndTurn: () => void;
};

export function BoardHeader({
  turnControlState,
  onRequestEndTurn,
}: BoardHeaderProps) {
  return (
    <header className="board-header">
      <button className="board-icon-button" type="button" aria-label="Open menu">
        <span className="board-icon-button__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div className="board-header__center" aria-hidden="true" />

      <div className="board-header__turn">
        <TurnControlsDock
          controlState={turnControlState}
          onRequestEndTurn={onRequestEndTurn}
        />
      </div>
    </header>
  );
}
