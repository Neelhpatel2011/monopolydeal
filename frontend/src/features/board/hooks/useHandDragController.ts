import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type {
  BoardInteractionEvent,
  BoardInteractionState,
  DragPreviewState,
} from "../model/interaction-types";

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
  isCurrentTurn: boolean;
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

export function useHandDragController({
  interactionState,
  dispatch,
  isCurrentTurn,
}: UseHandDragControllerArgs): UseHandDragControllerResult {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingSessionRef = useRef<HandDragSession | null>(null);
  const suppressClickCardIdRef = useRef<string | null>(null);
  const detachListenersRef = useRef<(() => void) | null>(null);
  const interactionStateRef = useRef(interactionState);
  const isCurrentTurnRef = useRef(isCurrentTurn);

  useEffect(() => {
    interactionStateRef.current = interactionState;
  }, [interactionState]);

  useEffect(() => {
    isCurrentTurnRef.current = isCurrentTurn;
  }, [isCurrentTurn]);

  function removeWindowListeners(
    listeners: Array<[string, EventListener, boolean | AddEventListenerOptions | undefined]>,
  ) {
    for (const [type, listener, options] of listeners) {
      window.removeEventListener(type, listener, options);
    }
  }

  function finishPendingSession() {
    detachListenersRef.current?.();
    detachListenersRef.current = null;
    pendingSessionRef.current = null;
  }

  function suppressNextClick(cardId: string) {
    suppressClickCardIdRef.current = cardId;

    window.setTimeout(() => {
      if (suppressClickCardIdRef.current === cardId) {
        suppressClickCardIdRef.current = null;
      }
    }, CLICK_SUPPRESSION_MS);
  }

  function cancelDragIfNeeded() {
    if (
      pendingSessionRef.current?.started ||
      interactionStateRef.current.mode === "dragging"
    ) {
      dispatch({ type: "CANCEL_DRAG" });
    }
  }

  useEffect(() => {
    if (isCurrentTurn) {
      return;
    }

    finishPendingSession();
    cancelDragIfNeeded();
  }, [isCurrentTurn]);

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
      (interactionState.mode === "selected" || interactionState.mode === "dragging") &&
      interactionState.origin === "hand" &&
      interactionState.selectedCardId !== pendingSession.cardId
    ) {
      finishPendingSession();
    }
  }, [interactionState]);

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
        dispatch({ type: "CANCEL_DRAG" });
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

    const onInterrupt = (_event?: Event) => {
      interruptSession();
    };

    const onVisibilityChange = (_event?: Event) => {
      if (document.visibilityState !== "visible") {
        interruptSession();
      }
    };

    const onViewportScroll = (_event?: Event) => {
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
    if (!isCurrentTurn || interactionState.mode !== "selected") {
      return;
    }

    if (interactionState.origin !== "hand" || interactionState.selectedCardId !== cardId) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    finishPendingSession();

    const session: HandDragSession = {
      cardId,
      pointerId: event.pointerId,
      pointerType: event.pointerType as DragPreviewState["pointerType"],
      startedAt: performance.now(),
      startClientX: event.clientX,
      startClientY: event.clientY,
      preview: createPreviewState(event, event.pointerType as DragPreviewState["pointerType"]),
      started: false,
    };

    pendingSessionRef.current = session;
    attachWindowListeners(session);
  }

  function shouldSuppressCardPress(cardId: string) {
    return suppressClickCardIdRef.current === cardId;
  }

  useEffect(() => () => finishPendingSession(), []);

  return {
    viewportRef,
    shouldSuppressCardPress,
    handleCardPointerDown,
  };
}
