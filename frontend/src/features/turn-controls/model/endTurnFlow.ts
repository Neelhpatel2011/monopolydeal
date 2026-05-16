export type EndTurnControlState = {
  disabled: boolean;
  emphasis: "ready" | "muted" | "blocked" | "pending";
  buttonLabel: string;
  helperText: string;
};

export type EndTurnConfirmCopy = {
  eyebrow: string;
  title: string;
  detail: string;
};

export type OutstandingEndTurnPayment = {
  playerName: string;
  amount: number;
  amountLabel: string;
  status: "awaiting_response" | "pending";
  statusLabel: string;
};

export function buildEndTurnConfirmCopy(actionsLeft: number): EndTurnConfirmCopy {
  if (actionsLeft > 0) {
    return {
      eyebrow: "End Turn",
      title: `End turn with ${actionsLeft} action${actionsLeft === 1 ? "" : "s"} left?`,
      detail:
        "You can still play cards this turn. Confirm only if you are done and want to pass play.",
    };
  }

  return {
    eyebrow: "End Turn",
    title: "Finish this turn?",
    detail: "No actions remain. Confirm to pass play to the next player.",
  };
}

export function buildOutstandingPaymentSummary(
  payments: OutstandingEndTurnPayment[],
): string | null {
  if (payments.length === 0) {
    return null;
  }

  if (payments.length === 1) {
    const payment = payments[0];
    return payment.status === "awaiting_response"
      ? `${payment.playerName} still needs to respond`
      : `${payment.playerName} still owes you ${payment.amountLabel}`;
  }

  return `${payments.length} players still need to resolve payment`;
}
