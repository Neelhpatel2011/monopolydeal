import {
  deriveHandCardIntentProfile,
  formatActionFieldLabel,
  formatTableauColor,
} from "../../board/model/card-intents";
import type { LocalHandCard, LocalPlayerState } from "../../board/model/localPlayer";
import type {
  ActionFieldKey,
  ActionFieldValue,
  DraftActionIntent,
  InvalidFeedback,
  TargetScope,
} from "../../board/model/interaction-types";
import type { OpponentSummary } from "../../opponents/model/opponentExpansion";

export const LOCAL_TABLEAU_TARGET_ID = "local-tableau";
export const LOCAL_BANK_TARGET_ID = "local-bank";

export type DragTargetDefinition = {
  id: string;
  scope: Extract<TargetScope, "tableau" | "bank" | "opponent">;
  label: string;
  detail: string;
  field: ActionFieldKey | null;
  value: ActionFieldValue | null;
};

export type ActionHintCopy = {
  eyebrow: string;
  title: string;
  detail: string;
  tone: "default" | "active" | "targeting" | "invalid";
};

export function getLocalTableauSetTargetId(setId: string): string {
  return `local-tableau:${setId}`;
}

export function getOpponentTargetId(opponentId: string): string {
  return `opponent:${opponentId}`;
}

function describeValidTargetRecovery(validTargets: DragTargetDefinition[]): string {
  if (validTargets.length === 0) {
    return "Keep the card selected and try again when a highlighted preview surface is available.";
  }

  const scopes = Array.from(new Set(validTargets.map((target) => target.scope)));

  if (scopes.length === 1) {
    switch (scopes[0]) {
      case "bank":
        return "Keep the card selected and aim for your highlighted bank.";
      case "tableau":
        return "Keep the card selected and aim for your highlighted tableau.";
      case "opponent":
        return "Keep the card selected and aim for a highlighted opponent.";
      default:
        break;
    }
  }

  return "Keep the card selected and release over one of the highlighted targets.";
}

function getAttemptedTargetCopy(args: {
  targetId: string | null;
  localPlayer: LocalPlayerState;
  opponents: OpponentSummary[];
}) {
  const { targetId, localPlayer, opponents } = args;

  if (!targetId) {
    return {
      title: "No preview target there",
      detailPrefix: "That release did not land on a highlighted target.",
    };
  }

  if (targetId === LOCAL_BANK_TARGET_ID) {
    return {
      title: "That card does not preview in your bank",
      detailPrefix: "Your bank is not a valid preview surface for this card.",
    };
  }

  if (targetId === LOCAL_TABLEAU_TARGET_ID) {
    return {
      title: "That card does not preview on your tableau",
      detailPrefix: "Your tableau is not a valid preview surface for this card.",
    };
  }

  if (targetId.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`)) {
    const setId = targetId.slice(`${LOCAL_TABLEAU_TARGET_ID}:`.length);
    const set = localPlayer.propertySets.find((propertySet) => propertySet.id === setId);

    return {
      title: `That card does not preview on ${set?.name ?? "that set"}`,
      detailPrefix: `${set?.name ?? "That property set"} is not a valid preview target for this card.`,
    };
  }

  if (targetId.startsWith("opponent:")) {
    const opponentId = targetId.replace(/^opponent:/, "");
    const opponent = opponents.find((entry) => entry.id === opponentId);

    return {
      title: `${opponent?.name ?? "That opponent"} is not a valid target`,
      detailPrefix: `${opponent?.name ?? "That opponent"} is not highlighted for this card.`,
    };
  }

  return {
    title: "That target is not available",
    detailPrefix: "This release is outside the current preview targets.",
  };
}

export function buildInvalidReleaseFeedback(args: {
  card: LocalHandCard;
  targetId: string | null;
  validTargets: DragTargetDefinition[];
  localPlayer: LocalPlayerState;
  opponents: OpponentSummary[];
}): InvalidFeedback {
  const { card, targetId, validTargets, localPlayer, opponents } = args;
  const attemptedTarget = getAttemptedTargetCopy({ targetId, localPlayer, opponents });

  return {
    kind: "invalidTarget",
    cardId: card.id,
    targetId: targetId ?? undefined,
    message: attemptedTarget.title,
    detail: `${attemptedTarget.detailPrefix} ${describeValidTargetRecovery(validTargets)}`,
  };
}

export function getValidDragTargets(
  card: LocalHandCard,
  intent: DraftActionIntent,
  localPlayer: LocalPlayerState,
  opponents: OpponentSummary[],
): DragTargetDefinition[] {
  const profile = deriveHandCardIntentProfile(card.label);
  const targets: DragTargetDefinition[] = [];

  if (profile.canBank) {
    targets.push({
      id: LOCAL_BANK_TARGET_ID,
      scope: "bank",
      label: "Your bank",
      detail: "Keep the card committed in your bank.",
      field: null,
      value: null,
    });
  }

  if (profile.actionType === "playProperty") {
    targets.push({
      id: LOCAL_TABLEAU_TARGET_ID,
      scope: "tableau",
      label: "Your tableau",
      detail: "Keep the play in your committed property area.",
      field: null,
      value: null,
    });

    for (const propertySet of localPlayer.propertySets) {
      const propertyColor =
        typeof intent.chosen.property_color === "string"
          ? intent.chosen.property_color
          : profile.propertyColor;

      if (
        propertyColor &&
        propertySet.color !== propertyColor &&
        card.label !== "Wild"
      ) {
        continue;
      }

      targets.push({
        id: getLocalTableauSetTargetId(propertySet.id),
        scope: "tableau",
        label: `${propertySet.name} set`,
        detail: `Preview the card on your ${propertySet.name} property set.`,
        field: card.label === "Wild" ? "property_color" : null,
        value: propertySet.color,
      });
    }
  }

  if (profile.actionType === "rent") {
    for (const opponent of opponents) {
      targets.push({
        id: getOpponentTargetId(opponent.id),
        scope: "opponent",
        label: opponent.name,
        detail: `Preview ${opponent.name} as the rent target.`,
        field: "target_player_id",
        value: opponent.id,
      });
    }
  }

  if (profile.actionType === "dealBreaker") {
    for (const opponent of opponents) {
      const completeSets = opponent.properties.filter((property) => property.isComplete);

      if (completeSets.length === 0) {
        continue;
      }

      targets.push({
        id: getOpponentTargetId(opponent.id),
        scope: "opponent",
        label: opponent.name,
        detail: `Preview ${opponent.name}; ${completeSets.length} complete set${completeSets.length === 1 ? "" : "s"} available.`,
        field: "target_player_id",
        value: opponent.id,
      });
    }
  }

  return targets;
}

function getRemainingMissingFields(
  intent: DraftActionIntent,
  target: DragTargetDefinition | null,
): ActionFieldKey[] {
  if (!target?.field) {
    return intent.missing;
  }

  return intent.missing.filter((field) => field !== target.field);
}

function formatTargetTitle(card: LocalHandCard, target: DragTargetDefinition): string {
  if (target.scope === "bank") {
    return `Previewing ${card.label} in bank`;
  }

  if (target.scope === "opponent") {
    return `Previewing ${target.label} as target`;
  }

  return `Previewing ${card.label} on ${target.label}`;
}

export function buildActionHintCopy(args: {
  isCurrentTurn: boolean;
  card: LocalHandCard | null;
  isDragging: boolean;
  isTargeting: boolean;
  validTargets: DragTargetDefinition[];
  previewTarget: DragTargetDefinition | null;
  invalidFeedback: InvalidFeedback | null;
  intent: DraftActionIntent | null;
}): ActionHintCopy {
  const { isCurrentTurn, card, isDragging, isTargeting, validTargets, previewTarget, invalidFeedback, intent } =
    args;

  if (!isCurrentTurn) {
    return {
      eyebrow: "Turn",
      title: "Waiting for your turn",
      detail: "Browse the board while the current player finishes their move.",
      tone: "default",
    };
  }

  if (card && invalidFeedback?.kind === "invalidTarget" && invalidFeedback.cardId === card.id) {
    return {
      eyebrow: "Invalid Target",
      title: invalidFeedback.message,
      detail:
        invalidFeedback.detail ??
        "Keep the card selected and release over a highlighted target to preview the play.",
      tone: "invalid",
    };
  }

  if (!card || !intent) {
    return {
      eyebrow: "Turn",
      title: "Play up to 3 cards",
      detail: "Tap a card to inspect it, then drag toward a highlighted surface to preview the play.",
      tone: "default",
    };
  }

  if (previewTarget) {
    const remainingFields = getRemainingMissingFields(intent, previewTarget);
    const nextField = remainingFields[0] ?? null;
    const fillMessage =
      previewTarget.field && previewTarget.value
        ? `This fills ${formatActionFieldLabel(previewTarget.field)} with ${
            previewTarget.field === "property_color" && typeof previewTarget.value === "string"
              ? formatTableauColor(previewTarget.value)
              : previewTarget.label
          }.`
        : previewTarget.detail;
    const nextMessage = nextField
      ? ` Next: choose ${formatActionFieldLabel(nextField)}.`
      : " Release still only previews in this slice.";

    return {
      eyebrow: "Target Preview",
      title: formatTargetTitle(card, previewTarget),
      detail: `${fillMessage}${nextMessage}`,
      tone: "targeting",
    };
  }

  if (isDragging || isTargeting) {
    const targetSummary = validTargets
      .map((target) => target.scope)
      .filter((scope, index, scopes) => scopes.indexOf(scope) === index)
      .join(", ");

    return {
      eyebrow: "Drag",
      title: `Move ${card.label} across valid targets`,
      detail: `Lit ${targetSummary || "board"} surfaces show preview-only targets. Leaving them clears the preview safely.`,
      tone: "active",
    };
  }

  return {
    eyebrow: "Selected Card",
    title: `${card.label} is ready`,
    detail: `${validTargets.length} preview target${validTargets.length === 1 ? "" : "s"} available. Drag to inspect the next step without submitting.`,
    tone: "active",
  };
}
