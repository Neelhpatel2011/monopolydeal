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
