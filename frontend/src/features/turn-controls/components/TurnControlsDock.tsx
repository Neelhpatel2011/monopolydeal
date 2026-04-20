import type { EndTurnControlState } from "../model/endTurnFlow";

type TurnControlsDockProps = {
  controlState: EndTurnControlState;
  onRequestEndTurn: () => void;
};

export function TurnControlsDock({
  controlState,
  onRequestEndTurn,
}: TurnControlsDockProps) {
  return (
    <div className="turn-controls-dock">
      <button
        className={`end-turn-button end-turn-button--${controlState.emphasis}`}
        type="button"
        disabled={controlState.disabled}
        aria-disabled={controlState.disabled || undefined}
        onClick={onRequestEndTurn}
      >
        <span>{controlState.buttonLabel}</span>
        <span aria-hidden="true">{controlState.emphasis === "pending" ? "..." : ">"}</span>
      </button>
      <p>{controlState.helperText}</p>
    </div>
  );
}
