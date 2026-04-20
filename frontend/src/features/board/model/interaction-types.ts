export type InteractionMode =
  | "idle"
  | "selected"
  | "dragging"
  | "targeting"
  | "submittingAction"
  | "submittingEndTurn"
  | "awaitingPrompt"
  | "paying"
  | "discarding";

export type InteractionOrigin = "hand" | "tableau" | "bank";

export type TargetScope = "board" | "opponent" | "tableau" | "bank" | "discard" | "prompt";

export type ActionFieldKey =
  | "property_color"
  | "rent_color"
  | "target_player_id"
  | "steal_card_id"
  | "give_card_id"
  | "steal_color"
  | "discard_ids";

export type ActionFieldValue = string | string[];

export type DraftActionIntent = {
  cardId: string;
  actionType: string;
  chosen: Partial<Record<ActionFieldKey, ActionFieldValue>>;
  missing: ActionFieldKey[];
};

export type InvalidFeedback = {
  kind: "invalidTarget" | "rejected" | "blocked";
  message: string;
  detail?: string;
  cardId?: string;
  targetId?: string;
};

export type DragPreviewState = {
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  pointerType: "mouse" | "touch" | "pen";
};

export type BoardInteractionTransientState = {
  expandedOpponentId: string | null;
  invalidFeedback: InvalidFeedback | null;
  endTurnConfirmOpen: boolean;
};

export type IdleInteractionState = BoardInteractionTransientState & {
  mode: "idle";
};

export type SelectedInteractionState = BoardInteractionTransientState & {
  mode: "selected";
  selectedCardId: string;
  origin: InteractionOrigin;
  intent: DraftActionIntent;
};

export type DraggingInteractionState = BoardInteractionTransientState & {
  mode: "dragging";
  selectedCardId: string;
  intent: DraftActionIntent;
  pointerId: string;
  origin: InteractionOrigin;
  hoverTargetId: string | null;
  preview: DragPreviewState;
};

export type TargetingInteractionState = BoardInteractionTransientState & {
  mode: "targeting";
  selectedCardId: string;
  origin: InteractionOrigin;
  intent: DraftActionIntent;
  pointerId: string;
  preview: DragPreviewState;
  targetScope: TargetScope;
  focusField: ActionFieldKey | null;
  previewTargetId: string | null;
};

export type SubmittingActionInteractionState = BoardInteractionTransientState & {
  mode: "submittingAction";
  origin: InteractionOrigin;
  intent: DraftActionIntent;
  submissionId: string;
};

export type SubmittingEndTurnInteractionState = BoardInteractionTransientState & {
  mode: "submittingEndTurn";
  submissionId: string;
};

export type AwaitingPromptInteractionState = BoardInteractionTransientState & {
  mode: "awaitingPrompt";
  promptKind: string;
};

export type PayingInteractionState = BoardInteractionTransientState & {
  mode: "paying";
  paymentRequestId: string;
  selectedCardIds: string[];
};

export type DiscardingInteractionState = BoardInteractionTransientState & {
  mode: "discarding";
  discardRequestId: string;
  selectedCardIds: string[];
};

export type BoardInteractionState =
  | IdleInteractionState
  | SelectedInteractionState
  | DraggingInteractionState
  | TargetingInteractionState
  | SubmittingActionInteractionState
  | SubmittingEndTurnInteractionState
  | AwaitingPromptInteractionState
  | PayingInteractionState
  | DiscardingInteractionState;

export type BoardInteractionEvent =
  | { type: "OPEN_OPPONENT_DETAIL"; opponentId: string }
  | { type: "CLOSE_OPPONENT_DETAIL" }
  | { type: "CLEAR_INVALID_FEEDBACK" }
  | { type: "SELECT_CARD"; origin: InteractionOrigin; intent: DraftActionIntent }
  | { type: "REPLACE_SELECTION"; origin: InteractionOrigin; intent: DraftActionIntent }
  | { type: "CLEAR_SELECTION" }
  | {
      type: "START_DRAG";
      pointerId: string;
      origin: InteractionOrigin;
      preview: DragPreviewState;
      hoverTargetId?: string | null;
    }
  | { type: "UPDATE_DRAG_PREVIEW"; clientX: number; clientY: number }
  | { type: "UPDATE_DRAG_TARGET"; targetId: string | null }
  | { type: "CANCEL_DRAG" }
  | { type: "INVALID_DRAG_RELEASE"; feedback: InvalidFeedback }
  | {
      type: "ENTER_TARGETING";
      targetScope: TargetScope;
      focusField?: ActionFieldKey | null;
      previewTargetId?: string | null;
    }
  | { type: "UPDATE_TARGET_PREVIEW"; targetId: string | null }
  | { type: "LEAVE_TARGETING" }
  | {
      type: "CONFIRM_TARGET";
      field: ActionFieldKey;
      value: ActionFieldValue;
      targetId?: string | null;
    }
  | { type: "CANCEL_TARGETING" }
  | { type: "OPEN_END_TURN_CONFIRM" }
  | { type: "CLOSE_END_TURN_CONFIRM" }
  | { type: "SUBMIT_ACTION_START"; submissionId: string }
  | { type: "SUBMIT_ACTION_RESOLVE" }
  | { type: "SUBMIT_ACTION_REJECTED"; feedback: InvalidFeedback; preserveSelection?: boolean }
  | { type: "SUBMIT_END_TURN_START"; submissionId: string }
  | { type: "SUBMIT_END_TURN_RESOLVE" }
  | { type: "SUBMIT_END_TURN_REJECTED"; feedback?: InvalidFeedback }
  | { type: "ENTER_AWAITING_PROMPT"; promptKind: string }
  | { type: "ENTER_PAYING"; paymentRequestId: string; selectedCardIds?: string[] }
  | { type: "TOGGLE_PAYMENT_CARD"; cardId: string }
  | { type: "ENTER_DISCARDING"; discardRequestId: string; selectedCardIds?: string[] }
  | { type: "TOGGLE_DISCARD_CARD"; cardId: string }
  | { type: "RESOLVE_BLOCKING_FLOW" }
  | { type: "SYNC_LOCAL_HAND_CONTEXT"; handCardIds: string[]; isCurrentTurn: boolean }
  | { type: "SERVER_DRAFT_INVALIDATED"; feedback?: InvalidFeedback }
  | { type: "TURN_OWNERSHIP_LOST"; feedback?: InvalidFeedback }
  | { type: "RESET_TO_IDLE" };
