export type BoardBlockingState = {
  gameOver?: {
    winnerName?: string;
    title?: string;
    detail?: string;
  };
  pendingPrompt?: {
    promptKind: string;
    title?: string;
    detail?: string;
  };
  paymentRequired?: {
    paymentRequestId: string;
    amountLabel?: string;
    payeeName?: string;
    title?: string;
    detail?: string;
  };
  discardRequired?: {
    discardRequestId: string;
    discardCount?: number;
    title?: string;
    detail?: string;
  };
};

export type ResolvedBoardOverlay =
  | {
      kind: "game_over";
      eyebrow: string;
      title: string;
      detail: string;
      emphasisLabel: string;
    }
  | {
      kind: "pending_prompt";
      promptKind: string;
      eyebrow: string;
      title: string;
      detail: string;
      emphasisLabel: string;
    }
  | {
      kind: "payment_required";
      paymentRequestId: string;
      eyebrow: string;
      title: string;
      detail: string;
      emphasisLabel: string;
    }
  | {
      kind: "discard_required";
      discardRequestId: string;
      eyebrow: string;
      title: string;
      detail: string;
      emphasisLabel: string;
    };

export function resolveBoardBlockingOverlay(
  state: BoardBlockingState | null | undefined,
): ResolvedBoardOverlay | null {
  if (!state) {
    return null;
  }

  if (state.gameOver) {
    return {
      kind: "game_over",
      eyebrow: "Game Over",
      title: state.gameOver.title ?? `${state.gameOver.winnerName ?? "A player"} wins`,
      detail:
        state.gameOver.detail ??
        "The round is complete. Normal play is locked while the final board state is shown.",
      emphasisLabel: state.gameOver.winnerName
        ? `Winner: ${state.gameOver.winnerName}`
        : "Final board state",
    };
  }

  if (state.pendingPrompt) {
    return {
      kind: "pending_prompt",
      promptKind: state.pendingPrompt.promptKind,
      eyebrow: "Pending Prompt",
      title: state.pendingPrompt.title ?? "Resolve the current prompt",
      detail:
        state.pendingPrompt.detail ??
        "This turn is paused until the required prompt choice is completed.",
      emphasisLabel: state.pendingPrompt.promptKind,
    };
  }

  if (state.paymentRequired) {
    return {
      kind: "payment_required",
      paymentRequestId: state.paymentRequired.paymentRequestId,
      eyebrow: "Payment Required",
      title:
        state.paymentRequired.title ??
        `Pay ${state.paymentRequired.amountLabel ?? "the required amount"}`,
      detail:
        state.paymentRequired.detail ??
        `Normal play is paused until the payment to ${
          state.paymentRequired.payeeName ?? "the requesting player"
        } is resolved.`,
      emphasisLabel: state.paymentRequired.payeeName
        ? `Owed to ${state.paymentRequired.payeeName}`
        : state.paymentRequired.amountLabel ?? "Blocking payment",
    };
  }

  if (state.discardRequired) {
    return {
      kind: "discard_required",
      discardRequestId: state.discardRequired.discardRequestId,
      eyebrow: "Discard Required",
      title:
        state.discardRequired.title ??
        `Discard ${state.discardRequired.discardCount ?? "the required cards"}`,
      detail:
        state.discardRequired.detail ??
        "You must finish the discard requirement before the turn can continue or end.",
      emphasisLabel:
        typeof state.discardRequired.discardCount === "number"
          ? `${state.discardRequired.discardCount} card${
              state.discardRequired.discardCount === 1 ? "" : "s"
            } required`
          : "Blocking discard",
    };
  }

  return null;
}
