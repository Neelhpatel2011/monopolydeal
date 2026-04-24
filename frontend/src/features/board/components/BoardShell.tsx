import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { BoardCenterStage } from "./BoardCenterStage";
import { BoardHeader } from "./BoardHeader";
import { LocalPlayerPanel } from "./LocalPlayerPanel";
import { BoardOverlayHost } from "./BoardOverlayHost";
import type { LocalHandCard, LocalPlayerState } from "../model/localPlayer";
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
  BOARD_PLAY_TARGET_ID,
  LOCAL_BANK_TARGET_ID,
  LOCAL_TABLEAU_TARGET_ID,
  buildActionHintCopy,
  buildInvalidReleaseFeedback,
  getOpponentTargetId,
  getValidDragTargets,
  type DragTargetDefinition,
} from "../../drag-targeting/model/target-preview";
import type { BoardBlockingState } from "../model/blocking-overlays";
import { resolveBoardBlockingOverlay } from "../model/blocking-overlays";
import { deriveEndTurnControlState } from "../../turn-controls/end-turn-policy";
import { EndTurnConfirmSheet } from "../../turn-controls/components/EndTurnConfirmSheet";
import type { BackendActionRequest, BackendPendingResponse, BackendPlayerView } from "../../../integration/backend/contracts";
import { ActionComposerSheet } from "./ActionComposerSheet";
import { buildActionRequestFromIntent, buildChangeWildRequest, applyChosenValue } from "../model/backendActionBridge";
import { PendingPromptSheet } from "./PendingPromptSheet";
import { PaymentFlowSheet } from "./PaymentFlowSheet";
import { DiscardFlowSheet } from "./DiscardFlowSheet";
import { getPendingPaymentSelectionSummary } from "../../../integration/backend/adapters";

type BoardShellProps = {
  roundLabel: string;
  actionsLeft: number;
  opponentSummaries: OpponentSummary[];
  opponentDetails: OpponentDetail[];
  localPlayer: LocalPlayerState;
  playerView: BackendPlayerView;
  discardTopCardId?: string;
  blockingState?: BoardBlockingState | null;
  drawCount?: number;
  onSubmitAction: (request: BackendActionRequest) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
  onSubmitPendingResponse: (pendingId: string, response: BackendPendingResponse) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
  onSubmitPayment: (selection: {
    bank: string[];
    properties: string[];
    buildings: string[];
  }) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
  onSubmitDiscard: (cardIds: string[]) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
  onConfirmEndTurn?: () => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
};

export function BoardShell({
  roundLabel,
  actionsLeft,
  opponentSummaries,
  opponentDetails,
  localPlayer,
  playerView,
  discardTopCardId,
  blockingState = null,
  drawCount = 0,
  onSubmitAction,
  onSubmitPendingResponse,
  onSubmitPayment,
  onSubmitDiscard,
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
  const [composerIntent, setComposerIntent] = useState<typeof activeIntent>(null);
  const [isPromptSubmitting, setIsPromptSubmitting] = useState(false);
  const hasOpponentDetailOpen = expandedOpponentId !== null;
  const canBrowseOpponents =
    selectCanBrowseOpponents(interactionState) && activeBlockingOverlay === null;
  const hasModalOverlayOpen =
    activeBlockingOverlay !== null ||
    endTurnConfirmOpen ||
    interactionState.mode === "submittingEndTurn" ||
    hasOpponentDetailOpen;
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
    onValidDropTarget: handleResolvedDropTarget,
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
  const pendingPrompt = playerView.pending_prompts[0] ?? null;
  const pendingPayment = useMemo(
    () => getPendingPaymentSelectionSummary(playerView, localPlayer.id),
    [localPlayer.id, playerView],
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
      intent: createHandSelectionIntent(card),
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
      const result = await Promise.resolve(onConfirmEndTurn?.());
      if (result?.status === "error") {
        throw new Error(result.message ?? "End turn failed.");
      }
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

  function resolveIntentContext(cardId?: string): {
    card: LocalHandCard;
    intent: NonNullable<typeof activeIntent>;
  } | null {
    const resolvedCardId = cardId ?? activeHandCard?.id ?? null;
    if (!resolvedCardId) {
      return null;
    }

    const card = localPlayer.handCards.find((entry) => entry.id === resolvedCardId) ?? null;
    if (!card) {
      return null;
    }

    const intent =
      activeIntent && activeIntent.cardId === resolvedCardId
        ? activeIntent
        : createHandSelectionIntent(card);

    return { card, intent };
  }

  async function submitSelectedIntent(
    intentToSubmit: NonNullable<typeof activeIntent>,
    cardOverride?: LocalHandCard,
  ) {
    const card = cardOverride ?? activeHandCard;
    if (!card) {
      return;
    }

    const submissionId = `action-${Date.now()}`;
    dispatch({ type: "SUBMIT_ACTION_START", submissionId });
    const result = await onSubmitAction(
      buildActionRequestFromIntent({
        playerId: localPlayer.id,
        card,
        intent: intentToSubmit,
      }),
    );

    if (result.status === "error") {
      dispatch({
        type: "SUBMIT_ACTION_REJECTED",
        feedback: createInvalidFeedback("rejected", result.message ?? "Action rejected"),
        preserveSelection: true,
      });
      return;
    }

    setComposerIntent(null);
    dispatch({ type: "SUBMIT_ACTION_RESOLVE" });
  }

  function handleIntentTarget(
    field: "property_color" | "rent_color" | "target_player_id",
    value: string,
    cardId?: string,
  ) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }
    const nextIntent = applyChosenValue(context.intent, field, value);
    if (nextIntent.missing.length === 0) {
      void submitSelectedIntent(nextIntent, context.card);
      return;
    }
    setComposerIntent(nextIntent);
  }

  function handleResolvedDropTarget(target: DragTargetDefinition, cardId: string) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }

    if (target.id === LOCAL_BANK_TARGET_ID) {
      handleBankTarget(cardId);
      return;
    }

    if (target.id === BOARD_PLAY_TARGET_ID) {
      handlePlayZonePress(cardId);
      return;
    }

    if (target.id === LOCAL_TABLEAU_TARGET_ID) {
      handleTableauTarget(cardId);
      return;
    }

    if (target.id.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`)) {
      handleTableauSetTarget(target.id.slice(`${LOCAL_TABLEAU_TARGET_ID}:`.length), cardId);
      return;
    }

    if (
      (target.field === "property_color" ||
        target.field === "rent_color" ||
        target.field === "target_player_id") &&
      typeof target.value === "string"
    ) {
      handleIntentTarget(target.field, target.value, context.card.id);
    }
  }

  function handlePlayZonePress(cardId?: string) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }
    if (
      context.intent.actionType === "play_bank" &&
      context.card.actionOptions?.cardKind === "money"
    ) {
      handleBankTarget(context.card.id);
      return;
    }
    if (context.intent.actionType === "play_property") {
      handleTableauTarget(context.card.id);
      return;
    }
    if (context.intent.actionType === "play_bank") {
      return;
    }
    if (context.intent.missing.length === 0) {
      void submitSelectedIntent(context.intent, context.card);
      return;
    }
    setComposerIntent(context.intent);
  }

  function handleBankTarget(cardId?: string) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }
    void submitSelectedIntent(
      {
        cardId: context.card.id,
        actionType: "play_bank",
        chosen: {},
        missing: [],
      },
      context.card,
    );
  }

  function handleTableauTarget(cardId?: string) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }
    if (
      context.intent.actionType !== "play_property" &&
      context.intent.actionType !== "play_action_non_counterable"
    ) {
      return;
    }
    if (context.intent.missing.includes("property_color")) {
      setComposerIntent(context.intent);
      return;
    }
    if (context.intent.missing.includes("rent_color")) {
      setComposerIntent(context.intent);
      return;
    }
    void submitSelectedIntent(context.intent, context.card);
  }

  function handleTableauSetTarget(setId: string, cardId?: string) {
    const context = resolveIntentContext(cardId);
    if (!context) {
      return;
    }
    if (
      context.intent.actionType !== "play_property" &&
      context.intent.actionType !== "play_action_non_counterable"
    ) {
      return;
    }
    const set = localPlayer.propertySets.find((entry) => entry.id === setId);
    if (!set) {
      return;
    }

    if (context.intent.missing.includes("property_color")) {
      handleIntentTarget("property_color", set.backendColor, context.card.id);
      return;
    }
    if (context.intent.missing.includes("rent_color")) {
      handleIntentTarget("rent_color", set.backendColor, context.card.id);
      return;
    }
    void submitSelectedIntent(context.intent, context.card);
  }

  function handleOpponentPress(opponentId: string) {
    if (activeHandCard && validTargets.some((target) => target.id === getOpponentTargetId(opponentId))) {
      handleIntentTarget("target_player_id", opponentId);
      return;
    }

    if (!canBrowseOpponents) {
      return;
    }
    dispatch({ type: "OPEN_OPPONENT_DETAIL", opponentId });
  }

  async function handleChangeWild(cardId: string, newColor: string) {
    const result = await onSubmitAction(
      buildChangeWildRequest({
        playerId: localPlayer.id,
        cardId,
        newColor,
      }),
    );
    if (result.status === "error") {
      dispatch({
        type: "SERVER_DRAFT_INVALIDATED",
        feedback: createInvalidFeedback("blocked", result.message ?? "Wild reassignment failed."),
      });
    }
  }

  return (
    <main className="board-page">
      <div
        className={`board-shell${hasModalOverlayOpen ? " board-shell--modal-active" : ""}${
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
          onOpen={handleOpponentPress}
        />
        <BoardCenterStage
          drawCount={drawCount}
          discardCount={playerView.discard_pile.length}
          discardTopCardId={discardTopCardId}
          onPlayZonePress={handlePlayZonePress}
        />
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
          onTargetTableau={handleTableauTarget}
          onTargetTableauSet={handleTableauSetTarget}
          onTargetBank={handleBankTarget}
          onChangeWild={handleChangeWild}
        />
      </div>

      {activeHandCard && dragPreview ? (
        <DragPreview
          card={activeHandCard}
          preview={dragPreview}
        />
      ) : null}

      {expandedOpponent &&
      activeBlockingOverlay?.kind !== "game_over" &&
      !endTurnConfirmOpen &&
      interactionState.mode !== "submittingEndTurn" ? (
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

      <BoardOverlayHost overlay={activeBlockingOverlay?.kind === "game_over" ? activeBlockingOverlay : null} />

      {composerIntent && activeHandCard ? (
        <ActionComposerSheet
          playerId={localPlayer.id}
          card={activeHandCard}
          intent={composerIntent}
          onClose={() => setComposerIntent(null)}
          onSubmit={async (intentToSubmit) => {
            await submitSelectedIntent(intentToSubmit);
          }}
        />
      ) : null}

      {activeBlockingOverlay?.kind === "pending_prompt" && pendingPrompt ? (
        <PendingPromptSheet
          prompt={pendingPrompt.prompt}
          isSubmitting={isPromptSubmitting}
          onAccept={async () => {
            setIsPromptSubmitting(true);
            try {
              await onSubmitPendingResponse(pendingPrompt.pending_id, "accept");
            } finally {
              setIsPromptSubmitting(false);
            }
          }}
          onJustSayNo={async () => {
            setIsPromptSubmitting(true);
            try {
              await onSubmitPendingResponse(pendingPrompt.pending_id, "just_say_no");
            } finally {
              setIsPromptSubmitting(false);
            }
          }}
        />
      ) : null}

      {activeBlockingOverlay?.kind === "payment_required" && pendingPayment ? (
        <PaymentFlowSheet
          amountDue={pendingPayment.amount}
          localPlayer={localPlayer}
          onSubmit={onSubmitPayment}
        />
      ) : null}

      {blockingState?.discardRequired ? (
        <DiscardFlowSheet
          requiredCount={blockingState.discardRequired.discardCount ?? 0}
          cards={localPlayer.handCards}
          onSubmit={onSubmitDiscard}
        />
      ) : null}
    </main>
  );
}
