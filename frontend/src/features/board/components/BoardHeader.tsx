import { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="board-header">
      <div className="board-header__menu" ref={menuRef}>
        <button
          className="board-icon-button"
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen || undefined}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="board-icon-button__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {menuOpen ? (
          <div className="board-header__menu-panel">
            <button className="board-header__menu-item" type="button">
              Game Log
            </button>
          </div>
        ) : null}
      </div>

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
