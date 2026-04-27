import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type {
  ActionFieldKey,
  BoardInteractionEvent,
  BoardInteractionState,
  DragPreviewState,
  InvalidFeedback,
} from "../model/interaction-types";
import { createHandSelectionIntent } from "../model/interaction-machine";
import type { LocalHandCard, LocalPlayerState } from "../model/localPlayer";
import type { OpponentSummary } from "../../opponents/model/opponentExpansion";
import {
  getValidDragTargets,
  type DragTargetDefinition,
} from "../../drag-targeting/model/target-preview";

const MOVE_THRESHOLD_PX = 8;
const TOUCH_HOLD_DELAY_MS = 140;
const CLICK_SUPPRESSION_MS = 220;

type HandDragSession = {
  cardId: string;
  pointerId: number;
  pointerType: DragPreviewState["pointerType"];
  startedAt: number;
  startClientX: number;
  startClientY: number;
  preview: DragPreviewState;
  started: boolean;
};

type UseHandDragControllerArgs = {
  interactionState: BoardInteractionState;
  dispatch: (event: BoardInteractionEvent) => void;
  activeCard: LocalHandCard | null;
  isCurrentTurn: boolean;
  localPlayer: LocalPlayerState;
  opponents: OpponentSummary[];
  validTargets: Map<string, DragTargetDefinition>;
  onValidDropTarget: (target: DragTargetDefinition, cardId: string) => void;
  createInvalidFeedback: (args: {
    card: LocalHandCard;
    targetId: string | null;
    validTargets: DragTargetDefinition[];
    localPlayer: LocalPlayerState;
    opponents: OpponentSummary[];
  }) => InvalidFeedback;
};

type UseHandDragControllerResult = {
  viewportRef: RefObject<HTMLDivElement>;
  shouldSuppressCardPress: (cardId: string) => boolean;
  handleCardPointerDown: (
    cardId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
};

function createPreviewState(
  event: ReactPointerEvent<HTMLButtonElement>,
  pointerType: DragPreviewState["pointerType"],
): DragPreviewState {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    clientX: event.clientX,
    clientY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    pointerType,
  };
}

function normalizePointerType(pointerType: string): DragPreviewState["pointerType"] {
  if (pointerType === "mouse" || pointerType === "pen") {
    return pointerType;
  }

  return "touch";
}

export function useHandDragController({
  interactionState,
  dispatch,
  activeCard,
  isCurrentTurn,
  localPlayer,
  opponents,
  validTargets,
  onValidDropTarget,
  createInvalidFeedback,
}: UseHandDragControllerArgs): UseHandDragControllerResult {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingSessionRef = useRef<HandDragSession | null>(null);
  const suppressClickCardIdRef = useRef<string | null>(null);
  const detachListenersRef = useRef<(() => void) | null>(null);
  const interactionStateRef = useRef(interactionState);
  const activeCardRef = useRef(activeCard);
  const isCurrentTurnRef = useRef(isCurrentTurn);
  const localPlayerRef = useRef(localPlayer);
  const opponentsRef = useRef(opponents);
  const validTargetsRef = useRef(validTargets);
  const onValidDropTargetRef = useRef(onValidDropTarget);
  const createInvalidFeedbackRef = useRef(createInvalidFeedback);

  useEffect(() => {
    interactionStateRef.current = interactionState;
  }, [interactionState]);

  useEffect(() => {
    activeCardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    isCurrentTurnRef.current = isCurrentTurn;
  }, [isCurrentTurn]);

  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  useEffect(() => {
    opponentsRef.current = opponents;
  }, [opponents]);

  useEffect(() => {
    validTargetsRef.current = validTargets;
  }, [validTargets]);

  useEffect(() => {
    onValidDropTargetRef.current = onValidDropTarget;
  }, [onValidDropTarget]);

  useEffect(() => {
    createInvalidFeedbackRef.current = createInvalidFeedback;
  }, [createInvalidFeedback]);

  function removeWindowListeners(
    listeners: Array<[string, EventListener, boolean | AddEventListenerOptions | undefined]>,
  ) {
    for (const [type, listener, options] of listeners) {
      window.removeEventListener(type, listener, options);
    }
  }

  function finishPendingSession() {
    const pendingSession = pendingSessionRef.current;
    detachListenersRef.current?.();
    detachListenersRef.current = null;
    pendingSessionRef.current = null;
    return pendingSession;
  }

  function suppressNextClick(cardId: string) {
    suppressClickCardIdRef.current = cardId;

    window.setTimeout(() => {
      if (suppressClickCardIdRef.current === cardId) {
        suppressClickCardIdRef.current = null;
      }
    }, CLICK_SUPPRESSION_MS);
  }

  useEffect(() => {
    if (isCurrentTurn) {
      return;
    }

    const pendingSession = finishPendingSession();
    if (
      pendingSession?.started ||
      interactionStateRef.current.mode === "dragging" ||
      interactionStateRef.current.mode === "targeting"
    ) {
      dispatch({ type: "CANCEL_DRAG" });
    }
  }, [dispatch, isCurrentTurn]);

  useEffect(() => {
    const pendingSession = pendingSessionRef.current;

    if (!pendingSession) {
      return;
    }

    if (interactionState.mode === "idle") {
      finishPendingSession();
      return;
    }

    if (
      (
        interactionState.mode === "selected" ||
        interactionState.mode === "dragging" ||
        interactionState.mode === "targeting"
      ) &&
      interactionState.origin === "hand" &&
      interactionState.selectedCardId !== pendingSession.cardId
    ) {
      finishPendingSession();
    }
  }, [interactionState]);

  function resolveTargetField(target: DragTargetDefinition): ActionFieldKey | null {
    return target.field;
  }

  function resolveBoardTargetId(clientX: number, clientY: number): string | null {
    return (
      document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>("[data-board-target-id]")
        ?.dataset.boardTargetId ?? null
    );
  }

  function resolveDragTarget(clientX: number, clientY: number): DragTargetDefinition | null {
    const targetId = resolveBoardTargetId(clientX, clientY);

    if (!targetId) {
      return null;
    }

    return validTargetsRef.current.get(targetId) ?? null;
  }

  function beginDrag(session: HandDragSession) {
    const latestState = interactionStateRef.current;

    if (
      !isCurrentTurnRef.current ||
      latestState.mode !== "selected" ||
      latestState.origin !== "hand" ||
      latestState.selectedCardId !== session.cardId
    ) {
      finishPendingSession();
      return;
    }

    session.started = true;
    dispatch({
      type: "START_DRAG",
      pointerId: String(session.pointerId),
      origin: "hand",
      preview: session.preview,
      hoverTargetId: null,
    });
    suppressNextClick(session.cardId);
  }

  function attachWindowListeners(session: HandDragSession) {
    const listeners: Array<[string, EventListener, boolean | AddEventListenerOptions | undefined]> = [];
    const viewport = viewportRef.current;

    const onPointerMove: EventListener = (event) => {
      const pointerEvent = event as globalThis.PointerEvent;
      if (pointerEvent.pointerId !== session.pointerId) {
        return;
      }

      session.preview = {
        ...session.preview,
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
      };

      if (!session.started) {
        const distance = Math.hypot(
          pointerEvent.clientX - session.startClientX,
          pointerEvent.clientY - session.startClientY,
        );

        if (
          distance >= MOVE_THRESHOLD_PX &&
          (session.pointerType === "mouse" ||
            performance.now() - session.startedAt >= TOUCH_HOLD_DELAY_MS)
        ) {
          beginDrag(session);
          return;
        }

        return;
      }

      pointerEvent.preventDefault();
      dispatch({
        type: "UPDATE_DRAG_PREVIEW",
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
      });

      const target = resolveDragTarget(pointerEvent.clientX, pointerEvent.clientY);
      const latestState = interactionStateRef.current;

      if (target) {
        if (
          latestState.mode !== "targeting" ||
          latestState.previewTargetId !== target.id ||
          latestState.targetScope !== target.scope
        ) {
          dispatch({
            type: "ENTER_TARGETING",
            targetScope: target.scope,
            focusField: resolveTargetField(target),
            previewTargetId: target.id,
          });
        }

        return;
      }

      if (latestState.mode === "targeting") {
        dispatch({ type: "LEAVE_TARGETING" });
      }
    };

    const endSession = () => {
      finishPendingSession();
    };

    const onPointerUp: EventListener = (event) => {
      const pointerEvent = event as globalThis.PointerEvent;
      if (pointerEvent.pointerId !== session.pointerId) {
        return;
      }

      if (session.started) {
        suppressNextClick(session.cardId);
        const target = resolveDragTarget(pointerEvent.clientX, pointerEvent.clientY);

        if (target) {
          dispatch({ type: "CANCEL_DRAG" });
          onValidDropTargetRef.current(target, session.cardId);
        } else {
          const card = activeCardRef.current;
          const targetId = resolveBoardTargetId(pointerEvent.clientX, pointerEvent.clientY);

          dispatch({
            type: "INVALID_DRAG_RELEASE",
            feedback:
              card === null
                ? {
                    kind: "invalidTarget",
                    message: "That target is not available",
                    detail:
                      "Keep the card selected and release over one of the highlighted targets.",
                    cardId: session.cardId,
                    targetId: targetId ?? undefined,
                  }
                : createInvalidFeedbackRef.current({
                    card,
                    targetId,
                    validTargets: Array.from(validTargetsRef.current.values()),
                    localPlayer: localPlayerRef.current,
                    opponents: opponentsRef.current,
                  }),
          });
        }
      }

      endSession();
    };

    const onPointerCancel: EventListener = (event) => {
      const pointerEvent = event as globalThis.PointerEvent;
      if (pointerEvent.pointerId !== session.pointerId) {
        return;
      }

      if (session.started) {
        suppressNextClick(session.cardId);
        dispatch({ type: "CANCEL_DRAG" });
      }

      endSession();
    };

    function interruptSession() {
      if (session.started) {
        suppressNextClick(session.cardId);
        dispatch({ type: "CANCEL_DRAG" });
      }

      endSession();
    }

    const onInterrupt = () => {
      interruptSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        interruptSession();
      }
    };

    const onViewportScroll = () => {
      if (!pendingSessionRef.current) {
        return;
      }

      interruptSession();
    };

    listeners.push(
      ["pointermove", onPointerMove, undefined],
      ["pointerup", onPointerUp, undefined],
      ["pointercancel", onPointerCancel, undefined],
      ["blur", onInterrupt, undefined],
      ["orientationchange", onInterrupt, undefined],
      ["pagehide", onInterrupt, undefined],
      ["scroll", onInterrupt, true],
      ["visibilitychange", onVisibilityChange, undefined],
    );

    for (const [type, listener, options] of listeners) {
      window.addEventListener(type, listener, options);
    }

    viewport?.addEventListener("scroll", onViewportScroll, { passive: true });

    detachListenersRef.current = () => {
      removeWindowListeners(listeners);
      viewport?.removeEventListener("scroll", onViewportScroll);
    };
  }

  function handleCardPointerDown(
    cardId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (!isCurrentTurn) {
      return;
    }

    if (
      interactionState.mode !== "idle" &&
      interactionState.mode !== "selected"
    ) {
      return;
    }

    if (!event.isPrimary) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const card = localPlayerRef.current.handCards.find((entry) => entry.id === cardId);
    if (!card) {
      return;
    }

    const isAlreadySelected =
      interactionState.mode === "selected" &&
      interactionState.origin === "hand" &&
      interactionState.selectedCardId === cardId;

    if (!isAlreadySelected) {
      const intent = createHandSelectionIntent(card);
      const immediateTargets = getValidDragTargets(
        card,
        intent,
        localPlayerRef.current,
        opponentsRef.current,
      );

      dispatch({
        type: "SELECT_CARD",
        origin: "hand",
        intent,
      });
      interactionStateRef.current = {
        mode: "selected",
        selectedCardId: intent.cardId,
        origin: "hand",
        intent,
        expandedOpponentId: null,
        invalidFeedback: null,
        endTurnConfirmOpen: false,
      };
      validTargetsRef.current = new Map(immediateTargets.map((target) => [target.id, target]));
      suppressNextClick(cardId);
    }

    finishPendingSession();
    const pointerType = normalizePointerType(event.pointerType);

    const session: HandDragSession = {
      cardId,
      pointerId: event.pointerId,
      pointerType,
      startedAt: performance.now(),
      startClientX: event.clientX,
      startClientY: event.clientY,
      preview: createPreviewState(event, pointerType),
      started: false,
    };

    pendingSessionRef.current = session;
    attachWindowListeners(session);
  }

  function shouldSuppressCardPress(cardId: string) {
    return suppressClickCardIdRef.current === cardId;
  }

  useEffect(() => {
    return () => {
      finishPendingSession();
    };
  }, []);

  return {
    viewportRef,
    shouldSuppressCardPress,
    handleCardPointerDown,
  };
}
