import { useEffect, useMemo, useReducer, useRef } from "react";
import { BoardCenterStage } from "./BoardCenterStage";
import { BoardHeader } from "./BoardHeader";
import { LocalPlayerPanel } from "./LocalPlayerPanel";
import { BoardOverlayHost } from "./BoardOverlayHost";
import type { LocalPlayerState } from "../model/localPlayer";
import { OpponentRail } from "../../opponents/components/OpponentRail";
import { OpponentDetailSheet } from "../../opponents/components/OpponentDetailSheet";
import { DragPreview } from "../../drag-targeting/components/DragPreview";
import type { OpponentDetail, OpponentSummary } from "../../opponents/model/opponentExpansion";
import {
  boardInteractionReducer,
  createInvalidFeedback,
  createHandSelectionIntent,
  createInitialInteractionState,
} from "../model/interaction-machine";
import {
  selectActiveIntent,
  selectCanBrowseOpponents,
  selectEndTurnConfirmOpen,
  selectExpandedOpponentId,
  selectDragPreview,
  selectDraggedCardId,
  selectInvalidFeedback,
  selectIsTargeting,
  selectSelectedCardId,
  selectSelectedCardOrigin,
  selectTargetPreviewId,
} from "../model/interaction-selectors";
import { useHandDragController } from "../hooks/useHandDragController";
import {
  LOCAL_BANK_TARGET_ID,
  LOCAL_TABLEAU_TARGET_ID,
  buildActionHintCopy,
  buildInvalidReleaseFeedback,
  getValidDragTargets,
} from "../../drag-targeting/model/target-preview";
import type { BoardBlockingState } from "../model/blocking-overlays";
import { resolveBoardBlockingOverlay } from "../model/blocking-overlays";
import { deriveEndTurnControlState } from "../../turn-controls/end-turn-policy";
import { EndTurnConfirmSheet } from "../../turn-controls/components/EndTurnConfirmSheet";

type BoardShellProps = {
  roundLabel: string;
  actionsLeft: number;
  opponentSummaries: OpponentSummary[];
  opponentDetails: OpponentDetail[];
  localPlayer: LocalPlayerState;
  blockingState?: BoardBlockingState | null;
  onConfirmEndTurn?: () => void | Promise<void>;
};

export function BoardShell({
  roundLabel,
  actionsLeft,
  opponentSummaries,
  opponentDetails,
  localPlayer,
  blockingState = null,
  onConfirmEndTurn,
}: BoardShellProps) {
  const isCurrentTurn = localPlayer.isCurrentTurn;
  const [interactionState, dispatch] = useReducer(
    boardInteractionReducer,
    undefined,
    createInitialInteractionState,
  );
  const previousIsCurrentTurnRef = useRef(isCurrentTurn);
  const expandedOpponentId = selectExpandedOpponentId(interactionState);
  const dragPreview = selectDragPreview(interactionState);
  const draggedCardId = selectDraggedCardId(interactionState);
  const invalidFeedback = selectInvalidFeedback(interactionState);
  const endTurnConfirmOpen = selectEndTurnConfirmOpen(interactionState);
  const selectedCardId = selectSelectedCardId(interactionState);
  const selectedOrigin = selectSelectedCardOrigin(interactionState);
  const activeIntent = selectActiveIntent(interactionState);
  const isTargeting = selectIsTargeting(interactionState);
  const previewTargetId = selectTargetPreviewId(interactionState);
  const activeBlockingOverlay = useMemo(
    () => resolveBoardBlockingOverlay(blockingState),
    [blockingState],
  );
  const canBrowseOpponents =
    selectCanBrowseOpponents(interactionState) && activeBlockingOverlay === null;
  const shouldSuspendBoardAffordances =
    activeBlockingOverlay !== null ||
    endTurnConfirmOpen ||
    interactionState.mode === "submittingEndTurn";
  const activeHandCardId = draggedCardId ?? selectedCardId;
  const activeHandCard = useMemo(
    () => localPlayer.handCards.find((card) => card.id === activeHandCardId) ?? null,
    [activeHandCardId, localPlayer.handCards],
  );
  const validTargets = useMemo(() => {
    if (!activeHandCard || !activeIntent || selectedOrigin !== "hand") {
      return [];
    }

    return getValidDragTargets(activeHandCard, activeIntent, localPlayer, opponentSummaries);
  }, [activeHandCard, activeIntent, localPlayer, opponentSummaries, selectedOrigin]);
  const validTargetMap = useMemo(
    () => new Map(validTargets.map((target) => [target.id, target])),
    [validTargets],
  );
  const previewTarget = previewTargetId ? validTargetMap.get(previewTargetId) ?? null : null;
  const invalidTargetId = invalidFeedback?.kind === "invalidTarget" ? invalidFeedback.targetId ?? null : null;
  const invalidTargetableTableauSetId =
    invalidTargetId && invalidTargetId.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`)
      ? invalidTargetId
      : null;
  const invalidOpponentId =
    invalidTargetId && invalidTargetId.startsWith("opponent:")
      ? invalidTargetId.replace(/^opponent:/, "")
      : null;
  const showTargetHighlights =
    interactionState.mode === "dragging" || interactionState.mode === "targeting";
  const targetableTableauSetIds = showTargetHighlights
    ? validTargets
        .filter(
          (target) =>
            target.scope === "tableau" && target.id.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`),
        )
        .map((target) => target.id)
    : [];
  const previewedTableauSetId =
    showTargetHighlights &&
    previewTarget?.scope === "tableau" &&
    previewTarget.id.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`)
      ? previewTarget.id
      : null;
  const targetableOpponentIds = showTargetHighlights
    ? validTargets
        .filter((target) => target.scope === "opponent")
        .map((target) => String(target.value ?? target.id.replace(/^opponent:/, "")))
    : [];
  const previewedOpponentId =
    showTargetHighlights && previewTarget?.scope === "opponent" && typeof previewTarget.value === "string"
      ? previewTarget.value
      : null;
  const actionHint = useMemo(
    () =>
      buildActionHintCopy({
        isCurrentTurn,
        card: activeHandCard,
        isDragging: interactionState.mode === "dragging",
        isTargeting,
        validTargets,
        previewTarget,
        invalidFeedback,
        intent: activeIntent,
      }),
    [
      activeHandCard,
      activeIntent,
      interactionState.mode,
      invalidFeedback,
      isCurrentTurn,
      isTargeting,
      previewTarget,
      validTargets,
    ],
  );
  const endTurnControlState = useMemo(
    () =>
      deriveEndTurnControlState({
        actionsLeft,
        blockingOverlay: activeBlockingOverlay,
        interactionState,
        isCurrentTurn,
      }),
    [actionsLeft, activeBlockingOverlay, interactionState, isCurrentTurn],
  );
  const handDragController = useHandDragController({
    interactionState,
    dispatch,
    isCurrentTurn,
    activeCard: activeHandCard,
    localPlayer,
    opponents: opponentSummaries,
    validTargets: validTargetMap,
    createInvalidFeedback: ({ card, targetId, validTargets: availableTargets }) =>
      buildInvalidReleaseFeedback({
        card,
        targetId,
        validTargets: availableTargets,
        localPlayer,
        opponents: opponentSummaries,
      }),
  });
  const expandedOpponent = useMemo(
    () => opponentDetails.find((opponent) => opponent.id === expandedOpponentId) ?? null,
    [expandedOpponentId, opponentDetails],
  );

  useEffect(() => {
    if (activeBlockingOverlay?.kind === "game_over") {
      if (
        interactionState.mode !== "idle" ||
        interactionState.expandedOpponentId !== null ||
        interactionState.endTurnConfirmOpen
      ) {
        dispatch({ type: "RESET_TO_IDLE" });
      }

      return;
    }

    if (!activeBlockingOverlay) {
      if (
        interactionState.mode === "awaitingPrompt" ||
        interactionState.mode === "paying" ||
        interactionState.mode === "discarding"
      ) {
        dispatch({ type: "RESOLVE_BLOCKING_FLOW" });
      }

      return;
    }

    switch (activeBlockingOverlay.kind) {
      case "pending_prompt":
        if (
          interactionState.mode !== "awaitingPrompt" ||
          interactionState.promptKind !== activeBlockingOverlay.promptKind
        ) {
          dispatch({
            type: "ENTER_AWAITING_PROMPT",
            promptKind: activeBlockingOverlay.promptKind,
          });
        }
        break;
      case "payment_required":
        if (
          interactionState.mode !== "paying" ||
          interactionState.paymentRequestId !== activeBlockingOverlay.paymentRequestId
        ) {
          dispatch({
            type: "ENTER_PAYING",
            paymentRequestId: activeBlockingOverlay.paymentRequestId,
          });
        }
        break;
      case "discard_required":
        if (
          interactionState.mode !== "discarding" ||
          interactionState.discardRequestId !== activeBlockingOverlay.discardRequestId
        ) {
          dispatch({
            type: "ENTER_DISCARDING",
            discardRequestId: activeBlockingOverlay.discardRequestId,
          });
        }
        break;
      default:
        break;
    }
  }, [activeBlockingOverlay, dispatch, interactionState]);

  useEffect(() => {
    if (
      !expandedOpponent &&
      !activeBlockingOverlay &&
      !endTurnConfirmOpen
    ) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeBlockingOverlay, endTurnConfirmOpen, expandedOpponent]);

  useEffect(() => {
    if (previousIsCurrentTurnRef.current && !isCurrentTurn) {
      dispatch({ type: "TURN_OWNERSHIP_LOST" });
    }

    previousIsCurrentTurnRef.current = isCurrentTurn;
  }, [dispatch, isCurrentTurn]);

  useEffect(() => {
    dispatch({
      type: "SYNC_LOCAL_HAND_CONTEXT",
      handCardIds: localPlayer.handCards.map((card) => card.id),
      isCurrentTurn,
    });
  }, [dispatch, isCurrentTurn, localPlayer.handCards]);

  useEffect(() => {
    if (!invalidFeedback || invalidFeedback.kind !== "invalidTarget") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "CLEAR_INVALID_FEEDBACK" });
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, invalidFeedback]);

  function handleHandCardPress(cardId: string) {
    if (handDragController.shouldSuppressCardPress(cardId)) {
      return;
    }

    if (!isCurrentTurn || shouldSuspendBoardAffordances) {
      return;
    }

    const card = localPlayer.handCards.find((handCard) => handCard.id === cardId);
    if (!card) {
      return;
    }

    dispatch({
      type: "SELECT_CARD",
      origin: "hand",
      intent: createHandSelectionIntent(cardId, card.label),
    });
  }

  function handleRequestEndTurn() {
    if (endTurnControlState.disabled) {
      return;
    }

    if (actionsLeft > 0) {
      dispatch({ type: "OPEN_END_TURN_CONFIRM" });
      return;
    }

    void handleConfirmEndTurn();
  }

  async function handleConfirmEndTurn() {
    const submissionId = `end-turn-${Date.now()}`;
    dispatch({ type: "SUBMIT_END_TURN_START", submissionId });

    try {
      await Promise.resolve(onConfirmEndTurn?.());
      dispatch({ type: "SUBMIT_END_TURN_RESOLVE" });
    } catch {
      dispatch({
        type: "SUBMIT_END_TURN_REJECTED",
        feedback: createInvalidFeedback(
          "blocked",
          "End turn could not be completed",
          {
            detail: "Try again once the board is ready.",
          },
        ),
      });
    }
  }

  return (
    <main className="board-page">
      <div
        className={`board-shell${shouldSuspendBoardAffordances ? " board-shell--modal-active" : ""}${
          activeBlockingOverlay ? " board-shell--blocked" : ""
        }`}
      >
        <BoardHeader
          roundLabel={roundLabel}
          turnControlState={endTurnControlState}
          onRequestEndTurn={handleRequestEndTurn}
        />
        <OpponentRail
          opponents={opponentSummaries}
          browseSuppressed={!canBrowseOpponents}
          targetableOpponentIds={targetableOpponentIds}
          invalidOpponentId={invalidOpponentId}
          previewedOpponentId={previewedOpponentId}
          onOpen={(opponentId) => {
            if (!canBrowseOpponents) {
              return;
            }

            dispatch({ type: "OPEN_OPPONENT_DETAIL", opponentId });
          }}
        />
        <BoardCenterStage drawCount={8} discardCount={5} />
        <LocalPlayerPanel
          {...localPlayer}
          selectedHandCardId={selectedOrigin === "hand" ? selectedCardId : null}
          draggingHandCardId={draggedCardId}
          handTrayViewportRef={handDragController.viewportRef}
          actionHint={actionHint}
          invalidHandCardId={
            invalidFeedback?.kind === "invalidTarget" && invalidFeedback.cardId === selectedCardId
              ? invalidFeedback.cardId ?? null
              : null
          }
          isTableauTargetable={
            showTargetHighlights && validTargets.some((target) => target.scope === "tableau")
          }
          isTableauPreviewed={
            showTargetHighlights && previewTarget?.id === LOCAL_TABLEAU_TARGET_ID
          }
          isTableauInvalid={invalidTargetId === LOCAL_TABLEAU_TARGET_ID}
          targetableTableauSetIds={targetableTableauSetIds}
          previewedTableauSetId={previewedTableauSetId}
          invalidTableauSetId={invalidTargetableTableauSetId}
          isBankTargetable={
            showTargetHighlights &&
            validTargets.some((target) => target.id === LOCAL_BANK_TARGET_ID)
          }
          isBankPreviewed={showTargetHighlights && previewTarget?.id === LOCAL_BANK_TARGET_ID}
          isBankInvalid={invalidTargetId === LOCAL_BANK_TARGET_ID}
          onHandCardPress={handleHandCardPress}
          onHandCardPointerDown={(cardId, event) => {
            if (shouldSuspendBoardAffordances) {
              return;
            }

            handDragController.handleCardPointerDown(cardId, event);
          }}
        />
      </div>

      {activeHandCard && dragPreview ? (
        <DragPreview
          card={activeHandCard}
          preview={dragPreview}
        />
      ) : null}

      {expandedOpponent && !shouldSuspendBoardAffordances ? (
        <OpponentDetailSheet
          opponent={expandedOpponent}
          opponents={opponentDetails}
          onClose={() => dispatch({ type: "CLOSE_OPPONENT_DETAIL" })}
          onSelectOpponent={(opponentId) =>
            dispatch({ type: "OPEN_OPPONENT_DETAIL", opponentId })
          }
        />
      ) : null}

      <EndTurnConfirmSheet
        actionsLeft={actionsLeft}
        isOpen={endTurnConfirmOpen}
        isSubmitting={interactionState.mode === "submittingEndTurn"}
        onCancel={() => dispatch({ type: "CLOSE_END_TURN_CONFIRM" })}
        onConfirm={handleConfirmEndTurn}
      />

      <BoardOverlayHost overlay={activeBlockingOverlay} />
    </main>
  );
}
