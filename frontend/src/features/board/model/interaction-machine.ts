import type {
  BoardInteractionEvent,
  BoardInteractionState,
  BoardInteractionTransientState,
  DiscardingInteractionState,
  DragPreviewState,
  DraggingInteractionState,
  DraftActionIntent,
  InteractionOrigin,
  InvalidFeedback,
  PayingInteractionState,
  TargetScope,
} from "./interaction-types";
import { createHandDraftActionIntent } from "./card-intents";
import type { LocalHandCard } from "./localPlayer";

const baseTransientState: BoardInteractionTransientState = {
  expandedOpponentId: null,
  invalidFeedback: null,
  endTurnConfirmOpen: false,
};

function mergeTransient(
  state: BoardInteractionState,
  overrides?: Partial<BoardInteractionTransientState>,
): BoardInteractionTransientState {
  return {
    expandedOpponentId: state.expandedOpponentId,
    invalidFeedback: state.invalidFeedback,
    endTurnConfirmOpen: state.endTurnConfirmOpen,
    ...overrides,
  };
}

function toIdle(
  state: BoardInteractionState,
  overrides?: Partial<BoardInteractionTransientState>,
): BoardInteractionState {
  return {
    mode: "idle",
    ...mergeTransient(state, overrides),
  };
}

function toSelected(
  state: BoardInteractionState,
  origin: InteractionOrigin,
  intent: DraftActionIntent,
  overrides?: Partial<BoardInteractionTransientState>,
): BoardInteractionState {
  return {
    mode: "selected",
    selectedCardId: intent.cardId,
    origin,
    intent,
    ...mergeTransient(state, overrides),
  };
}

function toggleCardId(cardIds: string[], cardId: string): string[] {
  return cardIds.includes(cardId)
    ? cardIds.filter((existingId) => existingId !== cardId)
    : [...cardIds, cardId];
}

function closeBrowsingWhileActing(
  overrides?: Partial<BoardInteractionTransientState>,
): Partial<BoardInteractionTransientState> {
  return {
    expandedOpponentId: null,
    endTurnConfirmOpen: false,
    ...overrides,
  };
}

function buildDraggingState(
  state: BoardInteractionState,
  pointerId: string,
  origin: InteractionOrigin,
  preview: DragPreviewState,
  hoverTargetId: string | null,
): DraggingInteractionState | null {
  if (state.mode !== "selected" || state.origin !== "hand" || origin !== "hand") {
    return null;
  }

  return {
    mode: "dragging",
    selectedCardId: state.selectedCardId,
    origin: state.origin,
    intent: state.intent,
    pointerId,
    hoverTargetId,
    preview,
    ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
  };
}

function buildTargetingState(
  state: BoardInteractionState,
  targetScope: TargetScope,
  focusField: keyof DraftActionIntent["chosen"] | null,
  previewTargetId: string | null,
): BoardInteractionState | null {
  if (state.mode === "targeting") {
    return {
      ...state,
      targetScope,
      focusField,
      previewTargetId,
      ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
    };
  }

  if (state.mode !== "dragging") {
    return null;
  }

  return {
    mode: "targeting",
    selectedCardId: state.selectedCardId,
    origin: state.origin,
    intent: state.intent,
    pointerId: state.pointerId,
    preview: state.preview,
    targetScope,
    focusField,
    previewTargetId,
    ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
  };
}

export function createInitialInteractionState(
  overrides?: Partial<BoardInteractionTransientState>,
): BoardInteractionState {
  return {
    mode: "idle",
    ...baseTransientState,
    ...overrides,
  };
}

export function boardInteractionReducer(
  state: BoardInteractionState,
  event: BoardInteractionEvent,
): BoardInteractionState {
  switch (event.type) {
    case "OPEN_OPPONENT_DETAIL":
      if (state.mode !== "idle" && state.mode !== "selected") {
        return state;
      }

      return {
        ...state,
        expandedOpponentId: event.opponentId,
        endTurnConfirmOpen: false,
        invalidFeedback: null,
      };

    case "CLOSE_OPPONENT_DETAIL":
      return {
        ...state,
        expandedOpponentId: null,
      };

    case "CLEAR_INVALID_FEEDBACK":
      return {
        ...state,
        invalidFeedback: null,
      };

    case "SELECT_CARD":
      if (state.mode !== "idle" && state.mode !== "selected") {
        return state;
      }

      if (
        state.mode === "selected" &&
        state.selectedCardId === event.intent.cardId &&
        state.origin === event.origin
      ) {
        return toIdle(state, closeBrowsingWhileActing({ invalidFeedback: null }));
      }

      return toSelected(
        state,
        event.origin,
        event.intent,
        closeBrowsingWhileActing({ invalidFeedback: null }),
      );

    case "REPLACE_SELECTION":
      if (state.mode !== "selected") {
        return state;
      }

      return toSelected(
        state,
        event.origin,
        event.intent,
        closeBrowsingWhileActing({ invalidFeedback: null }),
      );

    case "CLEAR_SELECTION":
      if (state.mode === "idle") {
        return {
          ...state,
          endTurnConfirmOpen: false,
        };
      }

      return toIdle(state, closeBrowsingWhileActing());

    case "START_DRAG": {
      const nextState = buildDraggingState(
        state,
        event.pointerId,
        event.origin,
        event.preview,
        event.hoverTargetId ?? null,
      );

      return nextState ?? state;
    }

    case "UPDATE_DRAG_PREVIEW":
      if (state.mode !== "dragging" && state.mode !== "targeting") {
        return state;
      }

      return {
        ...state,
        preview: {
          ...state.preview,
          clientX: event.clientX,
          clientY: event.clientY,
        },
      };

    case "UPDATE_DRAG_TARGET":
      if (state.mode !== "dragging") {
        return state;
      }

      return {
        ...state,
        hoverTargetId: event.targetId,
      };

    case "CANCEL_DRAG":
      if (state.mode !== "dragging" && state.mode !== "targeting") {
        return state;
      }

      return toSelected(state, state.origin, state.intent, { invalidFeedback: null });

    case "INVALID_DRAG_RELEASE":
      if (state.mode !== "dragging" && state.mode !== "targeting") {
        return state;
      }

      return toSelected(state, state.origin, state.intent, {
        invalidFeedback: event.feedback,
      });

    case "ENTER_TARGETING": {
      const nextState = buildTargetingState(
        state,
        event.targetScope,
        event.focusField ?? null,
        event.previewTargetId ?? null,
      );

      return nextState ?? state;
    }

    case "UPDATE_TARGET_PREVIEW":
      if (state.mode !== "targeting") {
        return state;
      }

      if (event.targetId === null) {
        return {
          mode: "dragging",
          selectedCardId: state.selectedCardId,
          intent: state.intent,
          pointerId: state.pointerId,
          origin: state.origin,
          hoverTargetId: null,
          preview: state.preview,
          ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
        };
      }

      return {
        ...state,
        previewTargetId: event.targetId,
      };

    case "LEAVE_TARGETING":
      if (state.mode !== "targeting") {
        return state;
      }

      return {
        mode: "dragging",
        selectedCardId: state.selectedCardId,
        intent: state.intent,
        pointerId: state.pointerId,
        origin: state.origin,
        hoverTargetId: null,
        preview: state.preview,
        ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
      };

    case "CONFIRM_TARGET": {
      if (state.mode !== "targeting") {
        return state;
      }

      const nextIntent: DraftActionIntent = {
        ...state.intent,
        chosen: {
          ...state.intent.chosen,
          [event.field]: event.value,
        },
        missing: state.intent.missing.filter((field) => field !== event.field),
      };

      if (nextIntent.missing.length === 0) {
        return toSelected(state, state.origin, nextIntent, { invalidFeedback: null });
      }

      return {
        ...state,
        intent: nextIntent,
        focusField: nextIntent.missing[0] ?? null,
        previewTargetId:
          event.targetId ?? (typeof event.value === "string" ? event.value : state.previewTargetId),
      };
    }

    case "CANCEL_TARGETING":
      if (state.mode !== "targeting") {
        return state;
      }

      return toSelected(state, state.origin, state.intent, { invalidFeedback: null });

    case "OPEN_END_TURN_CONFIRM":
      if (state.mode !== "idle" || state.expandedOpponentId !== null) {
        return state;
      }

      return {
        ...state,
        expandedOpponentId: null,
        endTurnConfirmOpen: true,
      };

    case "CLOSE_END_TURN_CONFIRM":
      return {
        ...state,
        endTurnConfirmOpen: false,
      };

    case "SUBMIT_ACTION_START":
      if (state.mode !== "selected" && state.mode !== "targeting" && state.mode !== "dragging") {
        return state;
      }

      return {
        mode: "submittingAction",
        origin: state.origin,
        intent: state.intent,
        submissionId: event.submissionId,
        ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
      };

    case "SUBMIT_ACTION_RESOLVE":
      if (state.mode !== "submittingAction") {
        return state;
      }

      return toIdle(state, closeBrowsingWhileActing({ invalidFeedback: null }));

    case "SUBMIT_ACTION_REJECTED":
      if (state.mode !== "submittingAction") {
        return {
          ...state,
          invalidFeedback: event.feedback,
        };
      }

      if (event.preserveSelection) {
        return toSelected(state, state.origin, state.intent, {
          invalidFeedback: event.feedback,
        });
      }

      return toIdle(state, {
        invalidFeedback: event.feedback,
      });

    case "SUBMIT_END_TURN_START":
      if (state.mode !== "idle") {
        return state;
      }

      return {
        mode: "submittingEndTurn",
        submissionId: event.submissionId,
        ...mergeTransient(state, {
          expandedOpponentId: null,
          invalidFeedback: null,
          endTurnConfirmOpen: false,
        }),
      };

    case "SUBMIT_END_TURN_RESOLVE":
      if (state.mode !== "submittingEndTurn") {
        return state;
      }

      return toIdle(state, { invalidFeedback: null });

    case "SUBMIT_END_TURN_REJECTED":
      if (state.mode !== "submittingEndTurn") {
        return {
          ...state,
          invalidFeedback: event.feedback ?? state.invalidFeedback,
        };
      }

      return {
        mode: "idle",
        ...mergeTransient(state, {
          invalidFeedback: event.feedback ?? null,
          endTurnConfirmOpen: true,
        }),
      };

    case "ENTER_AWAITING_PROMPT":
      return {
        mode: "awaitingPrompt",
        promptKind: event.promptKind,
        ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
      };

    case "ENTER_PAYING":
      return {
        mode: "paying",
        paymentRequestId: event.paymentRequestId,
        selectedCardIds: event.selectedCardIds ?? [],
        ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
      };

    case "TOGGLE_PAYMENT_CARD":
      if (state.mode !== "paying") {
        return state;
      }

      return {
        ...state,
        selectedCardIds: toggleCardId(state.selectedCardIds, event.cardId),
      };

    case "ENTER_DISCARDING":
      return {
        mode: "discarding",
        discardRequestId: event.discardRequestId,
        selectedCardIds: event.selectedCardIds ?? [],
        ...mergeTransient(state, closeBrowsingWhileActing({ invalidFeedback: null })),
      };

    case "TOGGLE_DISCARD_CARD":
      if (state.mode !== "discarding") {
        return state;
      }

      return {
        ...state,
        selectedCardIds: toggleCardId(state.selectedCardIds, event.cardId),
      };

    case "RESOLVE_BLOCKING_FLOW":
      if (
        state.mode !== "awaitingPrompt" &&
        state.mode !== "paying" &&
        state.mode !== "discarding"
      ) {
        return state;
      }

      return toIdle(state, { invalidFeedback: null });

    case "SYNC_LOCAL_HAND_CONTEXT":
      if (
        state.mode !== "selected" &&
        state.mode !== "dragging" &&
        state.mode !== "targeting"
      ) {
        return state;
      }

      if (state.origin !== "hand") {
        return state;
      }

      if (!event.isCurrentTurn || !event.handCardIds.includes(state.selectedCardId)) {
        return toIdle(state, closeBrowsingWhileActing({ invalidFeedback: null }));
      }

      return state;

    case "SERVER_DRAFT_INVALIDATED":
      if (state.mode === "idle") {
        return {
          ...state,
          invalidFeedback: event.feedback ?? null,
          endTurnConfirmOpen: false,
        };
      }

      return toIdle(state, {
        invalidFeedback: event.feedback ?? null,
      });

    case "TURN_OWNERSHIP_LOST":
      if (state.mode === "idle") {
        return {
          ...state,
          expandedOpponentId: null,
          endTurnConfirmOpen: false,
          invalidFeedback: event.feedback ?? null,
        };
      }

      if (state.mode === "selected" || state.mode === "dragging" || state.mode === "targeting") {
        if (state.origin !== "hand") {
          return state;
        }

        return toIdle(state, {
          invalidFeedback: event.feedback ?? null,
          expandedOpponentId: null,
          endTurnConfirmOpen: false,
        });
      }

      return toIdle(state, {
        invalidFeedback: event.feedback ?? null,
        expandedOpponentId: null,
        endTurnConfirmOpen: false,
      });

    case "RESET_TO_IDLE":
      return createInitialInteractionState();

    default:
      return state;
  }
}

export function seedPayingState(
  paymentRequestId: string,
  overrides?: Partial<PayingInteractionState>,
): PayingInteractionState {
  return {
    mode: "paying",
    paymentRequestId,
    selectedCardIds: [],
    ...baseTransientState,
    ...overrides,
  };
}

export function seedDiscardingState(
  discardRequestId: string,
  overrides?: Partial<DiscardingInteractionState>,
): DiscardingInteractionState {
  return {
    mode: "discarding",
    discardRequestId,
    selectedCardIds: [],
    ...baseTransientState,
    ...overrides,
  };
}

export function seedDraggingState(
  intent: DraftActionIntent,
  pointerId: string,
  origin: InteractionOrigin,
  overrides?: Partial<DraggingInteractionState>,
): DraggingInteractionState {
  return {
    mode: "dragging",
    selectedCardId: intent.cardId,
    intent,
    pointerId,
    origin,
    hoverTargetId: null,
    preview: {
      clientX: 0,
      clientY: 0,
      offsetX: 0,
      offsetY: 0,
      width: 0,
      height: 0,
      pointerType: "touch",
    },
    ...baseTransientState,
    ...overrides,
  };
}

export function createInvalidFeedback(
  kind: InvalidFeedback["kind"],
  message: string,
  extra?: Pick<InvalidFeedback, "cardId" | "detail" | "targetId">,
): InvalidFeedback {
  return {
    kind,
    message,
    ...extra,
  };
}

export function createHandSelectionIntent(
  card: Pick<LocalHandCard, "id" | "backendCardId" | "label" | "actionOptions">,
): DraftActionIntent {
  return createHandDraftActionIntent(card);
}
