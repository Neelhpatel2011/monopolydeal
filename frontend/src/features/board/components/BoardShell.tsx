import { useEffect, useMemo, useReducer } from "react";
import { BoardCenterStage } from "./BoardCenterStage";
import { BoardHeader } from "./BoardHeader";
import { LocalPlayerPanel } from "./LocalPlayerPanel";
import type { LocalPlayerState } from "../model/localPlayer";
import { OpponentRail } from "../../opponents/components/OpponentRail";
import { OpponentDetailSheet } from "../../opponents/components/OpponentDetailSheet";
import { DragPreview } from "../../drag-targeting/components/DragPreview";
import type { OpponentDetail, OpponentSummary } from "../../opponents/model/opponentExpansion";
import {
  boardInteractionReducer,
  createHandSelectionIntent,
  createInitialInteractionState,
} from "../model/interaction-machine";
import {
  selectExpandedOpponentId,
  selectDragPreview,
  selectDraggedCardId,
  selectSelectedCardId,
  selectSelectedCardOrigin,
} from "../model/interaction-selectors";
import { useHandDragController } from "../hooks/useHandDragController";

type BoardShellProps = {
  roundLabel: string;
  actionsLeft: number;
  opponentSummaries: OpponentSummary[];
  opponentDetails: OpponentDetail[];
  localPlayer: LocalPlayerState;
};

export function BoardShell({
  roundLabel,
  actionsLeft,
  opponentSummaries,
  opponentDetails,
  localPlayer,
}: BoardShellProps) {
  const [interactionState, dispatch] = useReducer(
    boardInteractionReducer,
    undefined,
    createInitialInteractionState,
  );
  const expandedOpponentId = selectExpandedOpponentId(interactionState);
  const dragPreview = selectDragPreview(interactionState);
  const draggedCardId = selectDraggedCardId(interactionState);
  const selectedCardId = selectSelectedCardId(interactionState);
  const selectedOrigin = selectSelectedCardOrigin(interactionState);
  const draggedHandCard = useMemo(
    () => localPlayer.handCards.find((card) => card.id === draggedCardId) ?? null,
    [draggedCardId, localPlayer.handCards],
  );
  const handDragController = useHandDragController({
    interactionState,
    dispatch,
    isCurrentTurn: localPlayer.isCurrentTurn ?? true,
  });
  const expandedOpponent = useMemo(
    () => opponentDetails.find((opponent) => opponent.id === expandedOpponentId) ?? null,
    [expandedOpponentId, opponentDetails],
  );

  useEffect(() => {
    if (!expandedOpponent) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedOpponent]);

  useEffect(() => {
    dispatch({
      type: "SYNC_LOCAL_HAND_CONTEXT",
      handCardIds: localPlayer.handCards.map((card) => card.id),
      isCurrentTurn: localPlayer.isCurrentTurn ?? true,
    });
  }, [dispatch, localPlayer.handCards, localPlayer.isCurrentTurn]);

  function handleHandCardPress(cardId: string) {
    if (handDragController.shouldSuppressCardPress(cardId)) {
      return;
    }

    if (!localPlayer.isCurrentTurn) {
      return;
    }

    dispatch({
      type: "SELECT_CARD",
      origin: "hand",
      intent: createHandSelectionIntent(cardId),
    });
  }

  return (
    <main className="board-page">
      <div className="board-shell">
        <BoardHeader roundLabel={roundLabel} actionsLeft={actionsLeft} />
        <OpponentRail
          opponents={opponentSummaries}
          onOpen={(opponentId) => dispatch({ type: "OPEN_OPPONENT_DETAIL", opponentId })}
        />
        <BoardCenterStage drawCount={8} discardCount={5} />
        <LocalPlayerPanel
          {...localPlayer}
          selectedHandCardId={selectedOrigin === "hand" ? selectedCardId : null}
          draggingHandCardId={draggedCardId}
          handTrayViewportRef={handDragController.viewportRef}
          onHandCardPress={handleHandCardPress}
          onHandCardPointerDown={handDragController.handleCardPointerDown}
        />
      </div>

      {draggedHandCard && dragPreview ? (
        <DragPreview
          card={draggedHandCard}
          preview={dragPreview}
        />
      ) : null}

      {expandedOpponent ? (
        <OpponentDetailSheet
          opponent={expandedOpponent}
          opponents={opponentDetails}
          onClose={() => dispatch({ type: "CLOSE_OPPONENT_DETAIL" })}
          onSelectOpponent={(opponentId) =>
            dispatch({ type: "OPEN_OPPONENT_DETAIL", opponentId })
          }
        />
      ) : null}
    </main>
  );
}
