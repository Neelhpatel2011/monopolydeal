import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BoardCardBack } from "../../../components/cards/BoardCardBack";
import type { LocalPlayerState } from "../model/localPlayer";
import type { OpponentSummary } from "../../opponents/model/opponentExpansion";

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
};

type DrawAnimationRun = {
  id: string;
  playerId: string;
  playerName: string;
  isLocalPlayer: boolean;
  items: DrawAnimationItem[];
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
};

const MAX_ANIMATED_CARDS = 5;
const CARD_STAGGER_MS = 150;
const CARD_FLIGHT_MS = 720;
const RUN_SETTLE_MS = 180;

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

function createAnimationItems(count: number, runId: string): DrawAnimationItem[] {
  return Array.from({ length: Math.min(Math.max(count, 1), MAX_ANIMATED_CARDS) }, (_, index) => ({
    id: `${runId}-${index}`,
    delayMs: index * CARD_STAGGER_MS,
    offsetX: (index - 0.5) * 8,
    offsetY: index * -3,
    rotation: index % 2 === 0 ? 7 : -6,
  }));
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
    };
    const previousSnapshot = previousSnapshotRef.current;
    previousSnapshotRef.current = nextSnapshot;

    if (!previousSnapshot || !normalizedCurrentPlayerId) {
      return;
    }

    const turnChanged =
      previousSnapshot.turnNumber !== turnNumber ||
      previousSnapshot.currentPlayerId !== normalizedCurrentPlayerId;
    const isStartOfTurnView = actionsTaken === 0;

    if (!turnChanged || !isStartOfTurnView) {
      return;
    }

    const geometry = getDrawGeometry(normalizedCurrentPlayerId, localPlayer.id);
    if (!geometry) {
      return;
    }

    const previousHandCount = previousSnapshot.handCounts[normalizedCurrentPlayerId] ?? 0;
    const nextHandCount = handCounts[normalizedCurrentPlayerId] ?? previousHandCount;
    const drawnCardCount = Math.max(1, nextHandCount - previousHandCount);
    const runId = `draw-${turnNumber}-${normalizedCurrentPlayerId}-${Date.now()}`;
    const items = createAnimationItems(drawnCardCount, runId);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setActiveRun({
      id: runId,
      playerId: normalizedCurrentPlayerId,
      playerName: getPlayerName(normalizedCurrentPlayerId, localPlayer, opponents),
      isLocalPlayer: normalizedCurrentPlayerId === localPlayer.id,
      items,
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
          ? "Drawing cards into your hand."
          : `${activeRun.playerName} is drawing cards.`}
      </span>
      {activeRun.items.map((item) => {
        const style = {
          "--draw-card-start-x": `${geometry.startX}px`,
          "--draw-card-start-y": `${geometry.startY}px`,
          "--draw-card-end-x": `${geometry.endX + item.offsetX}px`,
          "--draw-card-end-y": `${geometry.endY + item.offsetY}px`,
          "--draw-card-delay": `${item.delayMs}ms`,
          "--draw-card-rotation": `${item.rotation}deg`,
        } as CSSProperties;

        return (
          <div key={item.id} className="draw-card-animation__card" style={style} aria-hidden="true">
            <BoardCardBack tone="deck" size="sm" scale={0.22} className="draw-card-animation__card-back" />
          </div>
        );
      })}
    </div>
  );
}
