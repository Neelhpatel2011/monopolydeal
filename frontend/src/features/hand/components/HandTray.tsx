import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { LocalHandCard } from "../../board/model/localPlayer";
import { HandCard } from "./HandCard";

type HandTrayProps = {
  cards: LocalHandCard[];
  selectedCardId: string | null;
  draggingCardId: string | null;
  invalidCardId?: string | null;
  viewportRef: RefObject<HTMLDivElement>;
  onCardPress: (cardId: string) => void;
  onCardPointerDown: (cardId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function HandTray({
  cards,
  selectedCardId,
  draggingCardId,
  invalidCardId = null,
  viewportRef,
  onCardPress,
  onCardPointerDown,
}: HandTrayProps) {
  return (
    <section className="hand-tray" aria-label="Cards in hand">
      <div className="hand-tray__viewport" ref={viewportRef}>
        <div className="hand-tray__cards" role="list" aria-label="Hand cards">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`hand-tray__card-slot${
                draggingCardId === card.id ? " hand-tray__card-slot--drag-origin" : ""
              }${
                invalidCardId === card.id ? " hand-tray__card-slot--invalid" : ""
              }`}
              role="listitem"
            >
              <HandCard
                card={card}
                isSelected={selectedCardId === card.id}
                isDragOrigin={draggingCardId === card.id}
                isInvalid={invalidCardId === card.id}
                onPress={() => onCardPress(card.id)}
                onPointerDown={(event) => onCardPointerDown(card.id, event)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
