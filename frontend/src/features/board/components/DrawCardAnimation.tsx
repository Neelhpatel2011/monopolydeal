import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BoardCardBack } from "../../../components/cards/BoardCardBack";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { getHandRenderCard } from "../../../components/cards/boardCardAdapters";
import type { LocalPlayerState, LocalHandCard } from "../model/localPlayer";
import type { OpponentSummary } from "../../opponents/model/opponentExpansion";

// Deliberately paced so the draw motion communicates what changed instead of flashing by.
const MAX_ANIMATED_CARDS = 5;
const CARD_STAGGER_MS = 260;
const CARD_FLIGHT_MS = 1450;
const RUN_SETTLE_MS = 1050;

type DrawCardAnimationProps = {
  currentPlayerId?: string | null;
  turnNumber: number;
  actionsTaken: number;
  localPlayer: LocalPlayerState;
  opponents: OpponentSummary[];
};

type PlayerHandCounts = Record<string, number>;

type DrawAnimationItem = {
  id: string;
  delayMs: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  card?: LocalHandCard;
};

type DrawAnimationRun = {
  id: string;
  playerId: string;
  playerName: string;
  isLocalPlayer: boolean;
  items: DrawAnimationItem[];
  drawnCards: LocalHandCard[];
  geometry: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
};

type TurnSnapshot = {
  currentPlayerId: string | null;
  turnNumber: number;
  handCounts: PlayerHandCounts;
  localHandCards: LocalHandCard[];
};

function getHandCounts(localPlayer: LocalPlayerState, opponents: OpponentSummary[]): PlayerHandCounts {
  return {
    [localPlayer.id]: localPlayer.handCount,
    ...Object.fromEntries(opponents.map((opponent) => [opponent.id, opponent.handCount])),
  };
}

function getPlayerName(playerId: string, localPlayer: LocalPlayerState, opponents: OpponentSummary[]) {
  if (playerId === localPlayer.id) {
    return localPlayer.name;
  }

  return opponents.find((opponent) => opponent.id === playerId)?.name ?? playerId;
}

function getAnchorCenter(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getDrawGeometry(playerId: string, localPlayerId: string) {
  const deckCenter = getAnchorCenter("[data-draw-pile-anchor]");
  const targetCenter =
    playerId === localPlayerId
      ? getAnchorCenter("[data-player-hand-anchor]")
      : getAnchorCenter(`[data-opponent-hand-anchor="${CSS.escape(playerId)}"]`) ??
        getAnchorCenter(`[data-board-target-id="opponent:${CSS.escape(playerId)}"]`);

  if (!deckCenter || !targetCenter) {
    return null;
  }

  return {
    startX: deckCenter.x,
    startY: deckCenter.y,
    endX: targetCenter.x,
    endY: targetCenter.y,
  };
}

function getNewLocalHandCards(previousCards: LocalHandCard[], nextCards: LocalHandCard[]) {
  const previousIds = new Set(previousCards.map((card) => card.backendCardId));
  return nextCards.filter((card) => !previousIds.has(card.backendCardId));
}

function createAnimationItems(count: number, runId: string, cards: LocalHandCard[] = []): DrawAnimationItem[] {
  return Array.from({ length: Math.min(Math.max(count, 1), MAX_ANIMATED_CARDS) }, (_, index) => ({
    id: `${runId}-${index}`,
    delayMs: index * CARD_STAGGER_MS,
    offsetX: (index - 0.5) * 10,
    offsetY: index * -4,
    rotation: index % 2 === 0 ? 6 : -5,
    card: cards[index],
  }));
}

function DrawnCardPreviewList({ cards }: { cards: LocalHandCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  const visibleCards = cards.slice(0, MAX_ANIMATED_CARDS);
  const overflowCount = Math.max(0, cards.length - visibleCards.length);

  return (
    <aside className="draw-card-animation__reveal" aria-label="Cards added to your hand">
      <div className="draw-card-animation__reveal-copy">
        <p className="draw-card-animation__reveal-eyebrow">Added to hand</p>
        <strong>{cards.length === 1 ? "You drew this card" : `You drew ${cards.length} cards`}</strong>
      </div>
      <div className="draw-card-animation__reveal-cards" aria-hidden="true">
        {visibleCards.map((card, index) => {
          const renderCard = getHandRenderCard(card);

          return (
            <div
              key={`${card.backendCardId}-${index}`}
              className="draw-card-animation__reveal-card"
              style={{
                "--draw-card-reveal-rotation": `${(index - 1) * 3}deg`,
                "--draw-card-reveal-delay": `${420 + index * 110}ms`,
              } as CSSProperties}
            >
              <ScaledMonopolyCard
                card={renderCard}
                size="sm"
                scale={0.32}
                className="draw-card-animation__face-card"
                surfaceClassName="draw-card-animation__face-card-surface"
              />
            </div>
          );
        })}
        {overflowCount > 0 ? (
          <span className="draw-card-animation__reveal-overflow">+{overflowCount}</span>
        ) : null}
      </div>
    </aside>
  );
}

export function DrawCardAnimation({
  currentPlayerId = null,
  turnNumber,
  actionsTaken,
  localPlayer,
  opponents,
}: DrawCardAnimationProps) {
  const [activeRun, setActiveRun] = useState<DrawAnimationRun | null>(null);
  const previousSnapshotRef = useRef<TurnSnapshot | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const handCounts = useMemo(
    () => getHandCounts(localPlayer, opponents),
    [localPlayer, opponents],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const normalizedCurrentPlayerId = currentPlayerId ?? null;
    const nextSnapshot: TurnSnapshot = {
      currentPlayerId: normalizedCurrentPlayerId,
      turnNumber,
      handCounts,
      localHandCards: localPlayer.handCards,
    };
    const previousSnapshot = previousSnapshotRef.current;
    previousSnapshotRef.current = nextSnapshot;

    if (!previousSnapshot || !normalizedCurrentPlayerId) {
      return;
    }

    const previousHandCount = previousSnapshot.handCounts[normalizedCurrentPlayerId] ?? 0;
    const nextHandCount = handCounts[normalizedCurrentPlayerId] ?? previousHandCount;
    const handIncrease = Math.max(0, nextHandCount - previousHandCount);
    const turnChanged =
      previousSnapshot.turnNumber !== turnNumber ||
      previousSnapshot.currentPlayerId !== normalizedCurrentPlayerId;
    const shouldAnimateStartOfTurnDraw = turnChanged && actionsTaken === 0;
    const shouldAnimateHandIncrease = handIncrease > 0;

    if (!shouldAnimateStartOfTurnDraw && !shouldAnimateHandIncrease) {
      return;
    }

    const geometry = getDrawGeometry(normalizedCurrentPlayerId, localPlayer.id);
    if (!geometry) {
      return;
    }

    const drawnCardCount = shouldAnimateHandIncrease ? handIncrease : 1;
    const drawnCards =
      normalizedCurrentPlayerId === localPlayer.id
        ? getNewLocalHandCards(previousSnapshot.localHandCards, localPlayer.handCards)
        : [];
    const runId = `draw-${turnNumber}-${actionsTaken}-${normalizedCurrentPlayerId}-${Date.now()}`;
    const items = createAnimationItems(drawnCardCount, runId, drawnCards);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setActiveRun({
      id: runId,
      playerId: normalizedCurrentPlayerId,
      playerName: getPlayerName(normalizedCurrentPlayerId, localPlayer, opponents),
      isLocalPlayer: normalizedCurrentPlayerId === localPlayer.id,
      items,
      drawnCards,
      geometry,
    });

    timeoutRef.current = window.setTimeout(() => {
      setActiveRun((run) => (run?.id === runId ? null : run));
      timeoutRef.current = null;
    }, CARD_FLIGHT_MS + (items.length - 1) * CARD_STAGGER_MS + RUN_SETTLE_MS);
  }, [actionsTaken, currentPlayerId, handCounts, localPlayer, opponents, turnNumber]);

  if (!activeRun) {
    return null;
  }

  const { geometry } = activeRun;

  return (
    <div className="draw-card-animation" aria-live="polite" aria-atomic="true">
      <span className="draw-card-animation__status">
        {activeRun.isLocalPlayer
          ? activeRun.drawnCards.length > 0
            ? `You drew ${activeRun.drawnCards.map((card) => card.label).join(", ")}.`
            : "Drawing cards into your hand."
          : `${activeRun.playerName} is drawing cards.`}
      </span>
      <DrawnCardPreviewList cards={activeRun.isLocalPlayer ? activeRun.drawnCards : []} />
      {activeRun.items.map((item) => {
        const style = {
          "--draw-card-start-x": `${geometry.startX}px`,
          "--draw-card-start-y": `${geometry.startY}px`,
          "--draw-card-end-x": `${geometry.endX + item.offsetX}px`,
          "--draw-card-end-y": `${geometry.endY + item.offsetY}px`,
          "--draw-card-delay": `${item.delayMs}ms`,
          "--draw-card-rotation": `${item.rotation}deg`,
        } as CSSProperties;
        const renderCard = item.card ? getHandRenderCard(item.card) : null;

        return (
          <div
            key={item.id}
            className={`draw-card-animation__card${renderCard ? " draw-card-animation__card--face-up" : ""}`}
            style={style}
            aria-hidden="true"
          >
            {renderCard ? (
              <ScaledMonopolyCard
                card={renderCard}
                size="sm"
                scale={0.32}
                className="draw-card-animation__face-card"
                surfaceClassName="draw-card-animation__face-card-surface"
              />
            ) : (
              <BoardCardBack tone="deck" size="sm" scale={0.24} className="draw-card-animation__card-back" />
            )}
          </div>
        );
      })}
    </div>
  );
}
