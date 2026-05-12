import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { getHandRenderCard } from "../../../components/cards/boardCardAdapters";
import { formatCardColorLabel } from "../../../components/cards/cardUtils";
import { getActionTargetBadge, getRentTargetBadge } from "../../../components/cards/cardTargeting";
import type { MonopolyDealCardData } from "../../../types/monopolyDeal";
import type { LocalHandCard } from "../../board/model/localPlayer";
import { HandCard } from "./HandCard";

const HOLD_PREVIEW_DELAY_MS = 420;
const HOLD_CANCEL_DISTANCE_PX = 10;
const HOLD_CLICK_SUPPRESSION_MS = 240;

type HandTrayProps = {
  cards: LocalHandCard[];
  selectedCardId: string | null;
  draggingCardId: string | null;
  invalidCardId?: string | null;
  viewportRef: RefObject<HTMLDivElement>;
  onCardPress: (cardId: string) => void;
  onCardPointerDown: (cardId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
};

type HoldPreviewSession = {
  cardId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  timerId: number;
  isOpen: boolean;
};

function describeCard(card: MonopolyDealCardData) {
  const details: string[] = [];

  if (card.type === "property") {
    details.push(`${card.colors.map(formatCardColorLabel).join(" / ")} set`);
    details.push(`${card.setSize} cards to complete`);
    details.push(`Rent climbs to ${card.rents[card.rents.length - 1] ?? 0}M`);
  }

  if (card.type === "wild") {
    details.push(`Choose ${card.colors.map(formatCardColorLabel).join(" or ")}`);
  }

  if (card.type === "rent") {
    const targetBadge = getRentTargetBadge(card);
    details.push(
      card.rentColors.includes("any")
        ? "Charge any color you own"
        : `Charges ${card.rentColors.map(formatCardColorLabel).join(" or ")}`,
    );
    details.push(targetBadge.sentence);
  }

  if (card.type === "action") {
    const targetBadge = getActionTargetBadge(card);
    if (targetBadge) {
      details.push(targetBadge.sentence);
    }
  }

  if (card.type === "money") {
    details.push("Bank it to pay future rent");
  }

  if (card.value) {
    details.push(`Bank value ${card.value}`);
  }

  return {
    heading: card.name,
    typeLabel: card.label,
    body: card.description ?? "Play this card from your hand when it helps your turn plan.",
    details,
  };
}

function HandCardHoldPreview({ card }: { card: LocalHandCard }) {
  const renderCard = useMemo(() => getHandRenderCard(card), [card]);
  const descriptor = useMemo(() => describeCard(renderCard), [renderCard]);

  return (
    <div className="hand-card-preview" role="status" aria-live="polite">
      <div className="hand-card-preview__spotlight" aria-hidden="true" />
      <div className="hand-card-preview__card-wrap">
        <ScaledMonopolyCard
          card={renderCard}
          size="md"
          scale={0.78}
          className="hand-card-preview__card"
          surfaceClassName="hand-card-preview__card-surface"
        />
      </div>
      <section className="hand-card-preview__descriptor" aria-label={`${descriptor.heading} details`}>
        <p className="hand-card-preview__eyebrow">{descriptor.typeLabel}</p>
        <h3>{descriptor.heading}</h3>
        <p>{descriptor.body}</p>
        {descriptor.details.length > 0 ? (
          <div className="hand-card-preview__chips" aria-label="Card facts">
            {descriptor.details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function HandTray({
  cards,
  selectedCardId,
  draggingCardId,
  invalidCardId = null,
  viewportRef,
  onCardPress,
  onCardPointerDown,
}: HandTrayProps) {
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const holdSessionRef = useRef<HoldPreviewSession | null>(null);
  const suppressClickCardIdRef = useRef<string | null>(null);
  const previewCard = cards.find((card) => card.id === previewCardId) ?? null;

  const clearHoldSession = useCallback((options: { suppressClick?: boolean } = {}) => {
    const session = holdSessionRef.current;
    if (!session) {
      return;
    }

    window.clearTimeout(session.timerId);
    holdSessionRef.current = null;

    if (session.isOpen) {
      setPreviewCardId(null);
    }

    if (options.suppressClick || session.isOpen) {
      suppressClickCardIdRef.current = session.cardId;
      window.setTimeout(() => {
        if (suppressClickCardIdRef.current === session.cardId) {
          suppressClickCardIdRef.current = null;
        }
      }, HOLD_CLICK_SUPPRESSION_MS);
    }
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const session = holdSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - session.startClientX,
        event.clientY - session.startClientY,
      );

      if (distance > HOLD_CANCEL_DISTANCE_PX) {
        clearHoldSession();
      }
    }

    function handlePointerEnd(event: PointerEvent) {
      const session = holdSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      clearHoldSession({ suppressClick: session.isOpen });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerEnd, { passive: true });
    window.addEventListener("pointercancel", handlePointerEnd, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      clearHoldSession();
    };
  }, [clearHoldSession]);

  function handleCardPointerDown(cardId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    clearHoldSession();

    const timerId = window.setTimeout(() => {
      const session = holdSessionRef.current;
      if (!session || session.cardId !== cardId) {
        return;
      }

      session.isOpen = true;
      setPreviewCardId(cardId);
    }, HOLD_PREVIEW_DELAY_MS);

    holdSessionRef.current = {
      cardId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      timerId,
      isOpen: false,
    };

    onCardPointerDown(cardId, event);
  }

  function handleCardPress(cardId: string) {
    if (suppressClickCardIdRef.current === cardId) {
      suppressClickCardIdRef.current = null;
      return;
    }

    onCardPress(cardId);
  }

  return (
    <section className="hand-tray" aria-label="Cards in hand">
      <div className="hand-tray__viewport hand-tray__viewport--scrollable" ref={viewportRef}>
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
                onPress={() => handleCardPress(card.id)}
                onPointerDown={(event) => handleCardPointerDown(card.id, event)}
              />
            </div>
          ))}
        </div>
      </div>
      {previewCard ? <HandCardHoldPreview card={previewCard} /> : null}
    </section>
  );
}
