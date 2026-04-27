import type { ResolvedBoardOverlay } from "../board/model/blocking-overlays";
import type { BoardInteractionState } from "../board/model/interaction-types";
import type { EndTurnControlState } from "./model/endTurnFlow";

type DeriveEndTurnControlStateArgs = {
  actionsLeft: number;
  blockingOverlay: ResolvedBoardOverlay | null;
  interactionState: BoardInteractionState;
  isCurrentTurn: boolean;
  currentTurnPlayerName?: string | null;
};

export function deriveEndTurnControlState({
  actionsLeft,
  blockingOverlay,
  interactionState,
  isCurrentTurn,
  currentTurnPlayerName,
}: DeriveEndTurnControlStateArgs): EndTurnControlState {
  if (!isCurrentTurn) {
    return {
      disabled: true,
      emphasis: "muted",
      buttonLabel: "End Turn",
      helperText: currentTurnPlayerName
        ? `Waiting for ${currentTurnPlayerName}`
        : "Waiting for the current turn",
    };
  }

  if (blockingOverlay?.kind === "game_over") {
    return {
      disabled: true,
      emphasis: "blocked",
      buttonLabel: "Finished",
      helperText: "Game over has priority",
    };
  }

  if (blockingOverlay?.kind === "pending_prompt") {
    return {
      disabled: true,
      emphasis: "blocked",
      buttonLabel: "End Turn",
      helperText: "Resolve the prompt first",
    };
  }

  if (blockingOverlay?.kind === "payment_required") {
    return {
      disabled: true,
      emphasis: "blocked",
      buttonLabel: "End Turn",
      helperText: "Payment blocks the turn",
    };
  }

  if (blockingOverlay?.kind === "discard_required") {
    return {
      disabled: true,
      emphasis: "blocked",
      buttonLabel: "End Turn",
      helperText: "Discard before ending",
    };
  }

  if (interactionState.mode === "submittingEndTurn") {
    return {
      disabled: true,
      emphasis: "pending",
      buttonLabel: "Ending...",
      helperText: "Submitting end turn",
    };
  }

  if (interactionState.endTurnConfirmOpen) {
    return {
      disabled: true,
      emphasis: "muted",
      buttonLabel: "End Turn",
      helperText: "Confirmation open",
    };
  }

  if (interactionState.expandedOpponentId !== null) {
    return {
      disabled: true,
      emphasis: "muted",
      buttonLabel: "End Turn",
      helperText: "Close opponent detail first",
    };
  }

  if (interactionState.mode !== "idle") {
    return {
      disabled: true,
      emphasis: "muted",
      buttonLabel: "End Turn",
      helperText: "Finish the current interaction",
    };
  }

  return {
    disabled: false,
    emphasis: "ready",
    buttonLabel: "End Turn",
    helperText:
      actionsLeft > 0
        ? `${actionsLeft} action${actionsLeft === 1 ? "" : "s"} left`
        : "No actions left",
  };
}
