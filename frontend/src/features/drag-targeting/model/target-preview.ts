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
export const BOARD_PLAY_TARGET_ID = "board-play";

export type DragTargetDefinition = {
  id: string;
  scope: Extract<TargetScope, "board" | "tableau" | "bank" | "opponent">;
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
    return "Keep the card selected and try again when a highlighted drop surface is available.";
  }

  const scopes = Array.from(new Set(validTargets.map((target) => target.scope)));

  if (scopes.length === 1) {
    switch (scopes[0]) {
      case "bank":
        return "Keep the card selected and drop it on your highlighted bank.";
      case "tableau":
        return "Keep the card selected and drop it on your highlighted tableau.";
      case "opponent":
        return "Keep the card selected and drop it on a highlighted opponent.";
      case "board":
        return "Keep the card selected and drop it on the highlighted center play area.";
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
  const isTableauAttempt =
    targetId === LOCAL_TABLEAU_TARGET_ID ||
    targetId?.startsWith(`${LOCAL_TABLEAU_TARGET_ID}:`);

  if (card.backendCardId === "action_hotel" && isTableauAttempt) {
    const fullSetsWithoutHouse = localPlayer.propertySets.filter(
      (set) =>
        set.isComplete &&
        set.backendColor !== "railroad" &&
        set.backendColor !== "utility" &&
        !(set.buildings ?? []).includes("House"),
    );

    if (fullSetsWithoutHouse.length > 0) {
      return {
        kind: "invalidTarget",
        cardId: card.id,
        targetId: targetId ?? undefined,
        message: "Hotel needs a house first",
        detail: `You have a full set (${fullSetsWithoutHouse
          .map((set) => set.name)
          .join(", ")}), but hotels can only be added to a completed set that already has a house. Play a House on that full set before adding a Hotel.`,
      };
    }
  }

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
  void opponents;

  const profile = deriveHandCardIntentProfile(card);
  const targets: DragTargetDefinition[] = [];
  const chosenTargetPlayerId =
    typeof intent.chosen.target_player_id === "string" ? intent.chosen.target_player_id : null;

  function getFieldChoiceCount(field: ActionFieldKey): number {
    const fieldView = card.actionOptions?.fieldOptions.find((entry) => entry.field === field);
    if (!fieldView) {
      return 0;
    }

    if (fieldView.options.length > 0) {
      return fieldView.options.length;
    }

    if (chosenTargetPlayerId && fieldView.byTarget[chosenTargetPlayerId]) {
      return fieldView.byTarget[chosenTargetPlayerId]?.length ?? 0;
    }

    return Object.values(fieldView.byTarget).reduce(
      (count, options) => count + options.length,
      0,
    );
  }

  function canAdvanceIntentFromCurrentChoices() {
    return intent.missing.every((field) => getFieldChoiceCount(field) > 0);
  }

  function getFieldOptionValues(field: ActionFieldKey): Set<string> {
    const fieldView = card.actionOptions?.fieldOptions.find((entry) => entry.field === field);
    return new Set(
      fieldView?.options
        .map((option) => option.value)
        .filter((value): value is string => typeof value === "string") ?? [],
    );
  }

  function addLocalTableauTarget(detail: string) {
    if (targets.some((target) => target.id === LOCAL_TABLEAU_TARGET_ID)) {
      return;
    }

    targets.push({
      id: LOCAL_TABLEAU_TARGET_ID,
      scope: "tableau",
      label: "Your tableau",
      detail,
      field: null,
      value: null,
    });
  }

  function addSetChoiceTargets(field: "property_color" | "rent_color", detailPrefix: string) {
    const optionValues = getFieldOptionValues(field);

    for (const set of localPlayer.propertySets) {
      if (!optionValues.has(set.backendColor)) {
        continue;
      }

      targets.push({
        id: getLocalTableauSetTargetId(set.id),
        scope: "tableau",
        label: set.name,
        detail: `${detailPrefix} ${set.name}.`,
        field,
        value: set.backendColor,
      });
    }
  }

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

  if (profile.category === "money" && profile.canBank) {
    targets.push({
      id: BOARD_PLAY_TARGET_ID,
      scope: "board",
      label: "Play area",
      detail: "Drop here to commit this money card to your bank.",
      field: null,
      value: null,
    });
  }

  if (profile.actionType === "play_property") {
    targets.push({
      id: BOARD_PLAY_TARGET_ID,
      scope: "board",
      label: "Play area",
      detail: "Drop here to commit this property to your tableau.",
      field: null,
      value: null,
    });
    addLocalTableauTarget("Drop here to commit this property to your tableau.");

    if (intent.missing.includes("property_color")) {
      addSetChoiceTargets("property_color", "Drop here to choose");
    }
  }

  if (
    profile.actionType === "play_action_non_counterable" &&
    (card.backendCardId === "action_house" || card.backendCardId === "action_hotel")
  ) {
    if (intent.missing.includes("rent_color")) {
      addSetChoiceTargets("rent_color", "Drop here to add this building to");
    }

    if (getFieldChoiceCount("rent_color") > 0) {
      addLocalTableauTarget("Drop here to choose a completed set for this building.");
    }
  }

  if (
    profile.category !== "money" &&
    (profile.actionType === "play_action_non_counterable" ||
      profile.actionType === "play_action_counterable") &&
    (intent.missing.length === 0 || canAdvanceIntentFromCurrentChoices())
  ) {
    targets.push({
      id: BOARD_PLAY_TARGET_ID,
      scope: "board",
      label: "Play area",
      detail: "Submit the card to the center play area.",
      field: null,
      value: null,
    });
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
        "Keep the card selected and release over a highlighted target to continue the play.",
      tone: "invalid",
    };
  }

  if (!card || !intent) {
    return {
      eyebrow: "Turn",
      title: "Play up to 3 cards",
      detail: "Drag a card directly, or tap one first to preview its live drop zones.",
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
      ? ` Release to lock this step, then choose ${formatActionFieldLabel(nextField)}.`
      : " Release to submit this play.";

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
      detail: `Lit ${targetSummary || "board"} surfaces are live drop targets. Leaving them clears the current target safely.`,
      tone: "active",
    };
  }

  return {
    eyebrow: "Selected Card",
    title: `${card.label} is ready`,
    detail: `${validTargets.length} drop target${validTargets.length === 1 ? "" : "s"} available. Drag to bank or drop on the center play area.`,
    tone: "active",
  };
}
