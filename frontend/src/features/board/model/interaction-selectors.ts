import type {
  BoardInteractionState,
  DragPreviewState,
  DraftActionIntent,
  InteractionMode,
  InteractionOrigin,
} from "./interaction-types";

const blockingModes: InteractionMode[] = ["awaitingPrompt", "paying", "discarding"];

export function selectInteractionMode(state: BoardInteractionState): InteractionMode {
  return state.mode;
}

export function selectExpandedOpponentId(state: BoardInteractionState): string | null {
  return state.expandedOpponentId;
}

export function selectInvalidFeedback(state: BoardInteractionState) {
  return state.invalidFeedback;
}

export function selectIsBlockingFlow(state: BoardInteractionState): boolean {
  return blockingModes.includes(state.mode);
}

export function selectCanBrowseOpponents(state: BoardInteractionState): boolean {
  return state.mode === "idle" && !state.endTurnConfirmOpen && state.expandedOpponentId === null;
}

export function selectCanOpenEndTurnConfirm(state: BoardInteractionState): boolean {
  return state.mode === "idle" && !state.endTurnConfirmOpen && state.expandedOpponentId === null;
}

export function selectShouldDisableEndTurn(state: BoardInteractionState): boolean {
  return state.mode !== "idle";
}

export function selectEndTurnConfirmOpen(state: BoardInteractionState): boolean {
  return state.endTurnConfirmOpen;
}

export function selectSelectedCardId(state: BoardInteractionState): string | null {
  switch (state.mode) {
    case "selected":
    case "dragging":
    case "targeting":
      return state.selectedCardId;
    default:
      return null;
  }
}

export function selectSelectedCardOrigin(state: BoardInteractionState): InteractionOrigin | null {
  switch (state.mode) {
    case "selected":
    case "dragging":
    case "targeting":
      return state.origin;
    default:
      return null;
  }
}

export function selectActiveIntent(state: BoardInteractionState): DraftActionIntent | null {
  switch (state.mode) {
    case "selected":
    case "dragging":
    case "targeting":
    case "submittingAction":
      return state.intent;
    default:
      return null;
  }
}

export function selectCanStartDrag(state: BoardInteractionState): boolean {
  return state.mode === "selected" && state.origin === "hand";
}

export function selectCanEnterTargeting(state: BoardInteractionState): boolean {
  return state.mode === "dragging" || state.mode === "targeting";
}

export function selectTargetPreviewId(state: BoardInteractionState): string | null {
  return state.mode === "targeting" ? state.previewTargetId : null;
}

export function selectTargetFocusField(state: BoardInteractionState) {
  return state.mode === "targeting" ? state.focusField : null;
}

export function selectHoveredDragTargetId(state: BoardInteractionState): string | null {
  if (state.mode === "dragging") {
    return state.hoverTargetId;
  }

  if (state.mode === "targeting") {
    return state.previewTargetId;
  }

  return null;
}

export function selectDraggedCardId(state: BoardInteractionState): string | null {
  return state.mode === "dragging" || state.mode === "targeting" ? state.selectedCardId : null;
}

export function selectDragPreview(state: BoardInteractionState): DragPreviewState | null {
  return state.mode === "dragging" || state.mode === "targeting" ? state.preview : null;
}

export function selectIsTargeting(state: BoardInteractionState): boolean {
  return state.mode === "targeting";
}

export function selectSubmissionPending(state: BoardInteractionState): boolean {
  return state.mode === "submittingAction" || state.mode === "submittingEndTurn";
}

export function selectBlockingSelectionIds(state: BoardInteractionState): string[] {
  if (state.mode === "paying" || state.mode === "discarding") {
    return state.selectedCardIds;
  }

  return [];
}
