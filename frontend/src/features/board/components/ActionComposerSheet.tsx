import { useEffect, useMemo, useState } from "react";
import type { LocalHandCard, LocalPropertySet } from "../model/localPlayer";
import type { ActionFieldKey, DraftActionIntent } from "../model/interaction-types";
import { applyChosenValue, getComposerOptions } from "../model/backendActionBridge";
import {
  formatBankValue,
  formatColorLabel,
  getBackendCardMeta,
  toTableauColor,
} from "../../../integration/backend/catalog";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { getRenderCardByCatalogId } from "../../../components/cards/boardCardAdapters";
import { boardCardSurfacePresets } from "../../../components/cards/boardCardSurfaces";
import type { OpponentSummary } from "../../opponents/model/opponentExpansion";
import { getPropertySetSummaryData } from "../../tableau/model/propertySetSummary";

type ActionComposerSheetProps = {
  playerId: string;
  card: LocalHandCard;
  intent: DraftActionIntent;
  propertySets: LocalPropertySet[];
  opponents: OpponentSummary[];
  onClose: () => void;
  onSubmit: (intent: DraftActionIntent) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
};

const propertyChoiceSurfacePreset = boardCardSurfacePresets.hand;
const propertyChoiceCardScale = 0.24;
const progressPropertyChoiceCardScale = 0.16;

export function ActionComposerSheet({
  card,
  intent,
  propertySets,
  opponents,
  onClose,
  onSubmit,
}: ActionComposerSheetProps) {
  const [draftIntent, setDraftIntent] = useState(intent);
  const [playMode, setPlayMode] = useState<"effect" | "bank">("effect");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const meta = useMemo(() => getBackendCardMeta(card.backendCardId), [card.backendCardId]);
  const canChooseBankOrEffect =
    card.actionOptions?.canBank === true &&
    card.actionOptions?.cardKind !== "money" &&
    card.actionOptions?.cardKind !== "property" &&
    card.actionOptions?.cardKind !== "property_wild";
  const firstMissingField = draftIntent.missing[0] ?? null;
  const options = useMemo(
    () =>
      firstMissingField
        ? getComposerOptions({
            card,
            field: firstMissingField,
            chosen: draftIntent.chosen,
          })
        : [],
    [card, draftIntent.chosen, firstMissingField],
  );
  const fieldOrder = (card.actionOptions?.requiredFields ?? []) as ActionFieldKey[];
  const propertySetSummaryMap = useMemo(
    () =>
      new Map(
        propertySets.map((set) => [set.backendColor, getPropertySetSummaryData(set)]),
      ),
    [propertySets],
  );
  const chosenTargetPlayerId =
    typeof draftIntent.chosen.target_player_id === "string"
      ? draftIntent.chosen.target_player_id
      : null;
  const chosenTargetOpponent =
    chosenTargetPlayerId != null
      ? opponents.find((opponent) => opponent.id === chosenTargetPlayerId) ?? null
      : null;
  const chosenStealCardId =
    typeof draftIntent.chosen.steal_card_id === "string"
      ? draftIntent.chosen.steal_card_id
      : null;
  const chosenGiveCardId =
    typeof draftIntent.chosen.give_card_id === "string"
      ? draftIntent.chosen.give_card_id
      : null;
  const currentStepIndex =
    playMode === "effect" && firstMissingField
      ? fieldOrder.findIndex((field) => field === firstMissingField)
      : -1;
  const submitIntent =
    playMode === "bank"
      ? {
          cardId: draftIntent.cardId,
          actionType: "play_bank",
          chosen: {},
          missing: [],
        }
      : draftIntent;
  const isCompactTargetChargeFlow =
    canChooseBankOrEffect && meta.effectType === "charge_player";
  const isPropertyExchangeFlow =
    meta.effectType === "steal_property" || meta.effectType === "swap_property";
  const isWildPropertyAssignment =
    playMode === "effect" &&
    (meta.kind === "property_wild" || card.actionOptions?.cardKind === "property_wild") &&
    fieldOrder.includes("property_color");
  const isGuidedPropertyAction =
    playMode === "effect" && isPropertyExchangeFlow && !isCompactTargetChargeFlow;
  const missingSubmitField =
    playMode === "effect" ? submitIntent.missing[0] ?? null : null;
  const canSubmit = missingSubmitField == null && !isSubmitting;
  const targetOptions = useMemo(
    () =>
      isCompactTargetChargeFlow
        ? getComposerOptions({
            card,
            field: "target_player_id",
            chosen: draftIntent.chosen,
          })
        : [],
    [card, draftIntent.chosen, isCompactTargetChargeFlow],
  );
  const wildPropertyOptions = useMemo(
    () =>
      isWildPropertyAssignment
        ? getComposerOptions({
            card,
            field: "property_color",
            chosen: draftIntent.chosen,
          })
        : [],
    [card, draftIntent.chosen, isWildPropertyAssignment],
  );
  const availableDoubleRentCount = card.actionOptions?.availableDoubleRentCount ?? 0;
  const availableDoubleRentCardId = card.actionOptions?.availableDoubleRentCardId ?? null;
  const selectedDoubleRentIds = Array.isArray(draftIntent.chosen.double_rent_ids)
    ? draftIntent.chosen.double_rent_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const selectedDoubleRentCount = selectedDoubleRentIds.length;
  const chosenRentColor =
    typeof draftIntent.chosen.rent_color === "string" ? draftIntent.chosen.rent_color : null;
  const selectedPropertySet =
    chosenRentColor != null
      ? propertySets.find((set) => set.backendColor === chosenRentColor) ?? null
      : null;
  const chosenWildPropertyColor =
    typeof draftIntent.chosen.property_color === "string"
      ? draftIntent.chosen.property_color
      : null;
  const selectedWildPropertyLabel =
    chosenWildPropertyColor != null ? formatColorLabel(chosenWildPropertyColor) : null;
  const baseRentAmount = selectedPropertySet?.currentRentAmount ?? null;
  const rentMultiplier = 2 ** selectedDoubleRentCount;
  const boostedRentAmount = baseRentAmount != null ? baseRentAmount * rentMultiplier : null;
  const targetScope =
    meta.kind === "rent"
      ? meta.effectParams.target === "all_others"
        ? "ALL"
        : "1"
      : meta.effectType === "charge_players"
        ? "ALL"
        : fieldOrder.includes("target_player_id") || meta.effectType === "charge_player"
          ? "1"
          : null;
  const targetScopeLabel =
    targetScope === "ALL"
      ? "Targets all players"
      : targetScope === "1"
        ? "Targets 1 player"
        : null;

  useEffect(() => {
    setDraftIntent(intent);
    setPlayMode("effect");
    setErrorMessage(null);
  }, [intent]);

  function setDoubleRentCount(nextCount: number) {
    setErrorMessage(null);
    setDraftIntent((current) => ({
      ...current,
      chosen: {
        ...current.chosen,
        double_rent_ids:
          availableDoubleRentCardId && nextCount > 0
            ? Array.from({ length: nextCount }, () => availableDoubleRentCardId)
            : [],
      },
    }));
  }

  function getChosenOption(field: ActionFieldKey, value: string) {
    const fieldOptions = card.actionOptions?.fieldOptions.find((option) => option.field === field);
    if (!fieldOptions) {
      return null;
    }

    const targetedOptions =
      chosenTargetPlayerId && Object.keys(fieldOptions.byTarget).length > 0
        ? fieldOptions.byTarget[chosenTargetPlayerId] ?? []
        : [];

    return (
      targetedOptions.find((option) => option.value === value) ??
      fieldOptions.options.find((option) => option.value === value) ??
      null
    );
  }

  function getStepStatus(field: ActionFieldKey) {
    if (field === firstMissingField) {
      return "current" as const;
    }

    if (typeof draftIntent.chosen[field] === "string") {
      return "complete" as const;
    }

    return "upcoming" as const;
  }

  function isSetField(field: ActionFieldKey) {
    return field === "property_color" || field === "rent_color" || field === "steal_color";
  }

  function isPropertyCardChoiceField(field: ActionFieldKey) {
    return field === "steal_card_id" || field === "give_card_id";
  }

  function getPropertyChoicePreview(field: ActionFieldKey, optionValue: string) {
    if (!isPropertyCardChoiceField(field)) {
      return null;
    }

    const optionMeta = getBackendCardMeta(optionValue);
    if (optionMeta.kind !== "property" && optionMeta.kind !== "property_wild") {
      return null;
    }

    return getRenderCardByCatalogId(optionMeta.frontendCatalogCardId);
  }

  const chosenStealCardLabel =
    chosenStealCardId != null
      ? getChosenOption("steal_card_id", chosenStealCardId)?.label ?? chosenStealCardId
      : null;
  const chosenGiveCardLabel =
    chosenGiveCardId != null
      ? getChosenOption("give_card_id", chosenGiveCardId)?.label ?? chosenGiveCardId
      : null;
  const chosenTargetDisplayName = chosenTargetOpponent?.name ?? chosenTargetPlayerId;
  const chosenStealCardDisplayLabel =
    chosenStealCardLabel?.replace(/^[^:]+:\s*/, "") ?? null;
  const chosenGiveCardDisplayLabel =
    chosenGiveCardLabel?.replace(/^[^:]+:\s*/, "") ?? null;

  const actionOutcomeCopy = useMemo(() => {
    if (
      meta.effectType === "steal_property" &&
      chosenTargetDisplayName &&
      chosenStealCardDisplayLabel
    ) {
      return `You will steal ${chosenStealCardDisplayLabel} from ${chosenTargetDisplayName}.`;
    }

    if (
      meta.effectType === "swap_property" &&
      chosenTargetDisplayName &&
      chosenStealCardDisplayLabel &&
      chosenGiveCardDisplayLabel
    ) {
      return `You will take ${chosenStealCardDisplayLabel} from ${chosenTargetDisplayName} and give ${chosenGiveCardDisplayLabel}.`;
    }

    if (
      meta.effectType === "swap_property" &&
      chosenTargetDisplayName &&
      chosenStealCardDisplayLabel
    ) {
      return `Taking ${chosenStealCardDisplayLabel} from ${chosenTargetDisplayName}. Choose what you give back.`;
    }

    if (meta.effectType === "steal_property" && chosenTargetDisplayName) {
      return `Targeting ${chosenTargetDisplayName}. Choose the property to steal.`;
    }

    if (meta.effectType === "swap_property" && chosenTargetDisplayName) {
      return `Targeting ${chosenTargetDisplayName}. Choose the property to take.`;
    }

    return null;
  }, [
    chosenGiveCardDisplayLabel,
    chosenStealCardDisplayLabel,
    chosenTargetDisplayName,
    meta.effectType,
  ]);
  const bankValueLabel = formatBankValue(meta.moneyValue);
  const effectAmountLabel =
    typeof meta.effectParams.amount === "number"
      ? formatBankValue(meta.effectParams.amount)
      : null;
  const compactEffectNote = useMemo(() => {
    switch (meta.effectType) {
      case "charge_players": {
        return effectAmountLabel
          ? `Collect ${effectAmountLabel} from each opponent`
          : "Collect from each opponent";
      }
      case "charge_player":
        return effectAmountLabel
          ? `Collect ${effectAmountLabel} from one opponent`
          : "Collect from one opponent";
      case "draw_cards":
        return "Draw extra cards";
      case "steal_full_set":
        return "Take a complete set";
      case "steal_property":
        return "Steal a property";
      case "swap_property":
        return "Trade properties";
      case "building":
        return "Add to a property set";
      case "counter_action":
        return "Counter an action";
      default:
        return `Resolve ${meta.name}`;
    }
  }, [effectAmountLabel, meta.effectType, meta.name]);
  const compactEffectOutcome = isCompactTargetChargeFlow
    ? chosenTargetOpponent
      ? `collect ${effectAmountLabel ?? "money"} from ${chosenTargetOpponent.name}.`
      : `choose one opponent to collect ${effectAmountLabel ?? "money"} from.`
    : firstMissingField
      ? meta.kind === "rent"
        ? "choose target + set."
        : "choose target."
      : compactEffectNote.charAt(0).toLowerCase() + compactEffectNote.slice(1) + ".";
  const shouldShowModeOutcome =
    playMode === "bank" || !isPropertyExchangeFlow || isCompactTargetChargeFlow;
  const shouldRenderPropertyReadyEffect =
    playMode === "effect" && !firstMissingField && isPropertyExchangeFlow;
  const shouldRenderGenericReadyEffect =
    playMode === "effect" &&
    !firstMissingField &&
    !canChooseBankOrEffect &&
    !isPropertyExchangeFlow &&
    !isWildPropertyAssignment;

  function getFieldTitle(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return canChooseBankOrEffect ? "Choose player" : "Choose a target player";
      case "steal_color":
        return chosenTargetDisplayName
          ? `Choose a full set from ${chosenTargetDisplayName}`
          : "Choose a full set";
      case "steal_card_id":
        if (meta.effectType === "swap_property") {
          return chosenTargetDisplayName
            ? `Choose the property to take from ${chosenTargetDisplayName}`
            : "Choose the property you want to take";
        }
        return chosenTargetDisplayName
          ? `Choose the property to steal from ${chosenTargetDisplayName}`
          : "Choose a property to steal";
      case "give_card_id":
        return chosenTargetDisplayName
          ? `Choose the property you will give ${chosenTargetDisplayName}`
          : "Choose the property you will give away";
      case "rent_color":
        return meta.kind === "rent"
          ? "Choose which property set to charge"
          : "Choose the property set for this building";
      case "property_color":
        return "Choose which set this card joins";
      default:
        return "Choose the next step";
    }
  }

  function getCompactFieldLabel(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Target";
      case "rent_color":
        return "Charge set";
      case "property_color":
        return "Set";
      case "steal_card_id":
        return meta.effectType === "swap_property" ? "Take" : "Steal";
      case "give_card_id":
        return "Give";
      case "steal_color":
        return "Full set";
      default:
        return "Step";
    }
  }

  function getCompactStepTitle(field: ActionFieldKey) {
    if (field === "rent_color") {
      return "Choose property set";
    }

    return getFieldTitle(field);
  }

  function getFieldDescription(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        if (meta.effectType === "steal_property") {
          return "Pick the player you want to steal a property from.";
        }
        if (meta.effectType === "swap_property") {
          return "Pick the player you want to swap a property with.";
        }
        return `Pick the player affected by ${meta.name}.`;
      case "steal_color":
        return "Only full sets that can legally be stolen are shown here.";
      case "steal_card_id":
        return meta.effectType === "swap_property"
          ? "Choose the exact property you want to receive in the swap."
          : "Choose the exact property you want to steal.";
      case "give_card_id":
        return "Choose the exact property you will hand over to complete the swap.";
      case "rent_color":
        return meta.kind === "rent"
          ? "Pick the set color this rent card should charge."
          : "Pick the completed set where this building should be placed.";
      case "property_color":
        return "Choose the property color this card should be committed to.";
      default:
        return "Choose an option to continue.";
    }
  }

  function getGuidedStepTitle(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Choose opponent";
      case "steal_color":
        return "Pick full set";
      case "steal_card_id":
        return meta.effectType === "swap_property" ? "Pick what you take" : "Pick property";
      case "give_card_id":
        return "Pick what you give";
      default:
        return getFieldTitle(field);
    }
  }

  function getGuidedStepDescription(field: ActionFieldKey) {
    const targetName = chosenTargetDisplayName ?? "that player";

    switch (field) {
      case "target_player_id":
        return meta.effectType === "swap_property"
          ? "Select who you want to trade with."
          : "Select who you want to steal from.";
      case "steal_color":
        return "Choose the complete set you want to take.";
      case "steal_card_id":
        return `Choose one property from ${targetName}.`;
      case "give_card_id":
        return "Choose one of your properties to send back.";
      default:
        return getFieldDescription(field);
    }
  }

  function getBlockedActionLabel(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Choose opponent";
      case "steal_color":
        return "Choose set";
      case "steal_card_id":
        return meta.effectType === "swap_property"
          ? "Choose card to take"
          : "Choose card to steal";
      case "give_card_id":
        return "Choose card to give";
      case "rent_color":
      case "property_color":
        return "Choose property set";
      case "discard_ids":
        return "Choose cards";
      default:
        return "Finish choices";
    }
  }

  function getBlockedActionMessage(field: ActionFieldKey) {
    switch (field) {
      case "steal_card_id":
        return meta.effectType === "swap_property"
          ? "Choose the opponent property you want to take before playing this action."
          : "Choose the opponent property you want to steal before playing this action.";
      case "give_card_id":
        return "Choose one of your properties to give back before playing Forced Deal.";
      case "target_player_id":
        return "Choose an opponent before playing this action.";
      default:
        return "Finish the required choices before playing this action.";
    }
  }

  function getFieldInstruction(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Tap one opponent below to lock the target and move to the next decision.";
      case "rent_color":
        return meta.kind === "rent"
          ? "Choose the property set you want this rent card to charge."
          : "Choose the completed set where this building belongs.";
      case "property_color":
        return "Choose which of your property lanes this card should join.";
      case "steal_card_id":
        return "Choose the exact property card to take.";
      case "give_card_id":
        return "Choose the property card you will hand back.";
      case "steal_color":
        return "Choose the full set you want to claim.";
      default:
        return "Choose the next option to continue this play.";
    }
  }

  function formatChosenValue(field: ActionFieldKey, value: string) {
    const chosenOption = getChosenOption(field, value);
    if (chosenOption?.label) {
      return chosenOption.label;
    }

    switch (field) {
      case "property_color":
      case "rent_color":
      case "steal_color":
        return formatColorLabel(value);
      default:
        return value;
    }
  }

  function getFieldSummaryLabel(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Target";
      case "steal_color":
        return "Full set";
      case "steal_card_id":
        return meta.effectType === "swap_property" ? "Take" : "Steal";
      case "give_card_id":
        return "Give";
      case "rent_color":
        return meta.kind === "rent" ? "Charge set" : "Building set";
      case "property_color":
        return "Place in";
      default:
        return field;
    }
  }

  function handleResetFromField(field: ActionFieldKey) {
    const resetIndex = fieldOrder.findIndex((entry) => entry === field);
    if (resetIndex < 0) {
      return;
    }

    setDraftIntent((current) => {
      const nextChosen = { ...current.chosen };
      for (const key of fieldOrder.slice(resetIndex)) {
        delete nextChosen[key];
      }

      return {
        ...current,
        chosen: nextChosen,
        missing: fieldOrder.filter((key) => !(key in nextChosen)),
      };
    });
    setErrorMessage(null);
  }

  function getOptionMeta(field: ActionFieldKey, optionValue: string) {
    if (field === "target_player_id") {
      const opponent = opponents.find((entry) => entry.id === optionValue) ?? null;
      return {
        opponent,
        propertySummary:
          opponent != null
            ? `${opponent.properties.length} set${opponent.properties.length === 1 ? "" : "s"} visible`
            : null,
        localSet: null,
        opponentSet: null,
      };
    }

    const localSet = propertySets.find((set) => set.backendColor === optionValue) ?? null;
    const opponentSet =
      chosenTargetOpponent?.properties.find(
        (property) => property.color === toTableauColor(optionValue),
      ) ?? null;

    return {
      opponent: null,
      propertySummary: null,
      localSet,
      opponentSet,
    };
  }

  function renderProgressRail() {
    if (fieldOrder.length === 0) {
      return null;
    }

    return (
      <div
        className={`board-action-composer__progress${
          isGuidedPropertyAction ? " board-action-composer__progress--guided" : ""
        }`}
        aria-label="Action progress"
      >
        {fieldOrder.map((field, index) => {
          const status = getStepStatus(field);
          const chosenValue = draftIntent.chosen[field];
          const chosenPropertyPreview =
            typeof chosenValue === "string"
              ? getPropertyChoicePreview(field, chosenValue)
              : null;
          const compactChosenLabel =
            typeof chosenValue === "string"
              ? formatCompactChosenValue(field, chosenValue)
              : null;

          return (
            <div
              key={field}
              className={`board-action-composer__progress-step board-action-composer__progress-step--${status}`}
            >
              <span className="board-action-composer__progress-marker" aria-hidden="true">
                {status === "complete" && isGuidedPropertyAction
                  ? "\u2713"
                  : status === "complete"
                    ? "OK"
                    : index + 1}
              </span>

              <span className="board-action-composer__progress-copy">
                {chosenPropertyPreview ? (
                  <ScaledMonopolyCard
                    card={chosenPropertyPreview}
                    size={propertyChoiceSurfacePreset.size}
                    scale={progressPropertyChoiceCardScale}
                    className="hand-card__scaled-card board-action-composer__progress-property-card"
                    surfaceClassName="hand-card__scaled-card-surface"
                  />
                ) : null}
                <strong>{getFieldSummaryLabel(field)}</strong>
                {compactChosenLabel || !isGuidedPropertyAction ? (
                  <span className="board-action-composer__progress-value">
                    {compactChosenLabel ??
                      (status === "current" ? "Choose this next" : "Waiting")}
                  </span>
                ) : null}
              </span>

              {status === "complete" ? (
                <button
                  type="button"
                  className="board-action-composer__progress-action"
                  onClick={() => handleResetFromField(field)}
                >
                  {isGuidedPropertyAction ? "Edit" : "Change"}
                </button>
              ) : !isGuidedPropertyAction ? (
                <span
                  className={`board-action-composer__progress-pill board-action-composer__progress-pill--${status}`}
                >
                  {status === "current" ? "Now" : "Next"}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  function renderDecisionOption(field: ActionFieldKey, option: (typeof options)[number]) {
    const { opponent, propertySummary, localSet, opponentSet } = getOptionMeta(
      field,
      option.value,
    );
    const localSetSummary = localSet ? propertySetSummaryMap.get(localSet.backendColor) ?? null : null;
    const isTargetOption = field === "target_player_id";
    const isSetOption = isSetField(field);
    const isWildSetOption = isWildPropertyAssignment && field === "property_color";
    const isSelectedOption = draftIntent.chosen[field] === option.value;
    const propertyChoicePreview = getPropertyChoicePreview(field, option.value);
    const optionLabel = propertyChoicePreview
      ? option.label.replace(/^[^:]+:\s*/, "")
      : option.label;
    const detailCopy =
      (isGuidedPropertyAction || isWildPropertyAssignment) && propertyChoicePreview
        ? null
        : isWildPropertyAssignment && isSetOption
          ? "Tap to place the wild here."
          : option.detail ??
          (isTargetOption
            ? opponent != null
              ? isGuidedPropertyAction
                ? `${opponent.handCount} cards · ${opponent.bankTotal}`
                : `${opponent.handCount} cards · ${opponent.bankTotal} bank`
              : "Choose this player as the target."
            : localSetSummary != null
              ? `${localSetSummary.count}/${localSetSummary.targetSize} cards · Rent ${localSetSummary.currentRentLabel}`
              : opponentSet != null
                ? `${opponentSet.count}/${opponentSet.targetSize} cards in the set`
                : "Choose this option to continue.");

    return (
      <button
        key={option.value}
        type="button"
        className={`board-action-composer__decision-card${
          isTargetOption ? " board-action-composer__decision-card--target" : ""
        }${
          isSetOption ? " board-action-composer__decision-card--set" : ""
        }${
          propertyChoicePreview ? " board-action-composer__decision-card--property-choice" : ""
        }${
          isGuidedPropertyAction ? " board-action-composer__decision-card--guided" : ""
        }${
          isWildSetOption ? " board-action-composer__decision-card--wild" : ""
        }${
          isWildSetOption && isSelectedOption ? " board-action-composer__decision-card--selected" : ""
        }`}
        role={isWildSetOption ? "radio" : undefined}
        aria-checked={isWildSetOption ? isSelectedOption : undefined}
        onClick={() =>
          setDraftIntent((current) => applyChosenValue(current, field, option.value))
        }
      >
        <span className="board-action-composer__decision-leading">
          {isWildSetOption ? (
            <span className="board-action-composer__decision-check" aria-hidden="true">
              {isSelectedOption ? "✓" : ""}
            </span>
          ) : null}

          {isTargetOption && opponent ? (
            <span className={`avatar avatar--opponent avatar--${opponent.avatarTone ?? "sky"}`}>
              {opponent.avatarInitial}
            </span>
          ) : null}

          {isSetOption ? (
            <span
              className={`property-set__swatch property-set__swatch--${
                localSet?.color ?? toTableauColor(option.value)
              }`}
              aria-hidden="true"
            />
          ) : null}

          {propertyChoicePreview ? (
            <ScaledMonopolyCard
              card={propertyChoicePreview}
              size={propertyChoiceSurfacePreset.size}
              scale={propertyChoiceCardScale}
              className="hand-card__scaled-card board-action-composer__decision-property-card"
              surfaceClassName="hand-card__scaled-card-surface"
            />
          ) : null}

          <span className="board-action-composer__decision-copy">
            <strong>{optionLabel}</strong>
            {detailCopy ? (
              <span className="board-action-composer__decision-detail">{detailCopy}</span>
            ) : null}
          </span>
        </span>

        <span className="board-action-composer__decision-side">
          {propertySummary ? (
            <span className="board-action-composer__decision-chip">{propertySummary}</span>
          ) : null}
          {localSetSummary ? (
            <span className="board-action-composer__decision-chip">
              {localSetSummary.isComplete ? "Full set" : "In play"}
            </span>
          ) : null}
          {opponent?.isCurrentPlayer ? (
            <span className="board-action-composer__decision-chip">Current turn</span>
          ) : null}
          {!isWildPropertyAssignment ? (
            <span className="board-action-composer__decision-cta">Choose</span>
          ) : isSelectedOption ? (
            <span className="board-action-composer__decision-selected-label">Selected</span>
          ) : null}
        </span>
      </button>
    );
  }

  function formatCompactChosenValue(field: ActionFieldKey, value: string) {
    const label = formatChosenValue(field, value);
    return isPropertyCardChoiceField(field) ? label.replace(/^[^:]+:\s*/, "") : label;
  }

  function renderChosenTargetSummary(variant: "default" | "compact" = "default") {
    if (!chosenTargetOpponent || firstMissingField === "target_player_id") {
      return null;
    }

    const summaryClassName = `board-action-composer__target-summary${
      variant === "compact" ? " board-action-composer__target-summary--compact" : ""
    }`;

    return (
      <div className={summaryClassName} aria-live="polite">
        {variant === "default" ? (
          <span
            className={`avatar avatar--opponent avatar--${chosenTargetOpponent.avatarTone ?? "sky"}`}
          >
            {chosenTargetOpponent.avatarInitial}
          </span>
        ) : null}
        <span className="board-action-composer__target-summary-copy">
          {variant === "default" ? <span>Selected target</span> : null}
          <strong>{chosenTargetOpponent.name}</strong>
          <span>
            {chosenTargetOpponent.handCount} cards · {chosenTargetOpponent.bankTotal} bank
          </span>
        </span>
        <button
          type="button"
          className="board-action-composer__target-summary-action"
          onClick={() => handleResetFromField("target_player_id")}
        >
          Change
        </button>
      </div>
    );
  }

  function renderCompactDecisionPanel() {
    if (!firstMissingField) {
      return renderCompactReadyPanel();
    }

    return (
      <div className="board-action-composer__compact-panel">
        <div className="board-action-composer__compact-head">
          <div>
            <span>{getCompactFieldLabel(firstMissingField)}</span>
            <h3>{getCompactStepTitle(firstMissingField)}</h3>
          </div>
          <strong>
            Step {currentStepIndex + 1}/{fieldOrder.length}
          </strong>
        </div>
        {renderChosenTargetSummary("compact")}
        <p className="board-action-composer__compact-instruction">
          Pick a set to charge.
        </p>
        <div className="board-action-composer__decision-list board-action-composer__decision-list--compact">
          {options.map((option) => renderDecisionOption(firstMissingField, option))}
        </div>
      </div>
    );
  }

  function renderCompactReadyPanel() {
    const chosenFields = fieldOrder.filter(
      (field) => typeof draftIntent.chosen[field] === "string",
    );

    if (chosenFields.length === 0) {
      return null;
    }

    return (
      <div className="board-action-composer__compact-panel board-action-composer__compact-panel--ready">
        <div className="board-action-composer__compact-head">
          <div>
            <span>Review play</span>
            <h3>Ready to charge</h3>
          </div>
          <strong>All choices set</strong>
        </div>

        <div className="board-action-composer__compact-review-list" aria-label="Selected choices">
          {chosenFields.map((field) => {
            const chosenValue = draftIntent.chosen[field];
            if (typeof chosenValue !== "string") {
              return null;
            }

            return (
              <div key={field} className="board-action-composer__compact-review-row">
                <span className="board-action-composer__compact-review-copy">
                  <span>{getFieldSummaryLabel(field)}</span>
                  <strong>{formatCompactChosenValue(field, chosenValue)}</strong>
                </span>
                <button
                  type="button"
                  className="board-action-composer__compact-review-action"
                  onClick={() => handleResetFromField(field)}
                >
                  Change
                </button>
              </div>
            );
          })}
        </div>

        <p className="board-action-composer__compact-ready-copy">
          {boostedRentAmount != null
            ? `This will charge ${formatBankValue(boostedRentAmount)}. Press Play action to resolve, or change any choice above.`
            : "Press Play action to resolve, or change any choice above."}
        </p>
      </div>
    );
  }

  function renderCompactTargetOption(option: (typeof targetOptions)[number]) {
    const { opponent } = getOptionMeta("target_player_id", option.value);
    const isSelected = chosenTargetPlayerId === option.value;
    const detailCopy =
      option.detail ??
      (opponent
        ? `${opponent.bankTotal} bank - ${opponent.handCount} cards in hand`
        : "Choose this player.");

    return (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={isSelected}
        className={`board-action-composer__target-option${
          isSelected ? " board-action-composer__target-option--active" : ""
        }`}
        onClick={() => {
          setDraftIntent((current) =>
            applyChosenValue(current, "target_player_id", option.value),
          );
          setErrorMessage(null);
        }}
      >
        <span className="board-action-composer__mode-radio" aria-hidden="true" />
        <span className="board-action-composer__target-copy">
          <strong>{opponent?.name ?? option.label}</strong>
          <span>{detailCopy}</span>
        </span>
        <span className="board-action-composer__choice-tag">
          {isSelected ? "Selected" : targetScopeLabel ?? "Target"}
        </span>
      </button>
    );
  }

  async function handleSubmit() {
    if (missingSubmitField) {
      setErrorMessage(getBlockedActionMessage(missingSubmitField));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onSubmit(submitIntent);
      if (result.status === "error") {
        setErrorMessage(result.message ?? "That play could not be completed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function getPrimaryActionLabel() {
    if (isSubmitting) {
      return "Submitting...";
    }

    if (playMode === "bank") {
      return `Bank ${bankValueLabel}`;
    }

    if (missingSubmitField) {
      return getBlockedActionLabel(missingSubmitField);
    }

    if (isWildPropertyAssignment) {
      return `Place wild`;
    }

    if (isGuidedPropertyAction) {
      return `Play ${meta.name}`;
    }

    return canChooseBankOrEffect ? "Play action" : `Play ${meta.name}`;
  }

  return (
    <div className="board-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className={`board-modal-sheet board-action-composer${
          canChooseBankOrEffect ? " board-action-composer--choice-flow" : ""
        }${
          isPropertyExchangeFlow ? " board-action-composer--guided-property" : ""
        }${
          isWildPropertyAssignment ? " board-action-composer--wild-assignment" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-composer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">
              {meta.kind === "rent" ? "Rent Card" : "Action Card"}
            </p>
            <h2 id="action-composer-title">{meta.name}</h2>
            <p className="board-modal-sheet__copy board-action-composer__headline">
              {canChooseBankOrEffect
                ? "Pick one use for this card."
                : isWildPropertyAssignment
                  ? "Pick where this wild card goes."
                  : `Follow the guided sequence below to resolve ${meta.name}.`}
            </p>
          </div>
          <button type="button" className="board-modal-sheet__close" onClick={onClose}>
            X
          </button>
        </div>

        {canChooseBankOrEffect ? (
          <div className="board-modal-sheet__body board-action-composer__section board-action-composer__mode-section">
            <div className="board-action-composer__section-header">
              <p className="board-modal-sheet__eyebrow">Use Card As</p>
            </div>
            <div
              className="board-action-composer__mode-list"
              role="radiogroup"
              aria-label="Use card as"
            >
              <button
                type="button"
                role="radio"
                aria-checked={playMode === "effect"}
                className={`board-action-composer__mode-option board-action-composer__mode-option--simple${
                  playMode === "effect" ? " board-action-composer__mode-option--active" : ""
                }`}
                onClick={() => {
                  setPlayMode("effect");
                  setErrorMessage(null);
                }}
              >
                <span className="board-action-composer__mode-radio" aria-hidden="true" />
                <span className="board-action-composer__choice-copy">
                  <strong>Play action</strong>
                  <span className="board-action-composer__choice-detail">
                    {compactEffectNote}
                  </span>
                </span>
                <span className="board-action-composer__mode-hint" aria-hidden="true">
                  Action
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={playMode === "bank"}
                className={`board-action-composer__mode-option${
                  playMode === "bank" ? " board-action-composer__mode-option--active" : ""
                }`}
                onClick={() => {
                  setPlayMode("bank");
                  setErrorMessage(null);
                }}
              >
                <span className="board-action-composer__mode-radio" aria-hidden="true" />
                <span className="board-action-composer__choice-copy">
                  <strong>Bank card</strong>
                  <span className="board-action-composer__choice-detail">
                    Add {bankValueLabel} to bank
                  </span>
                </span>
                <span className="board-action-composer__choice-tag">
                  {bankValueLabel}
                </span>
              </button>
            </div>
            {shouldShowModeOutcome ? (
              <p className="board-action-composer__mode-outcome" aria-live="polite">
                <strong>{playMode === "bank" ? "Bank:" : "Play:"}</strong>{" "}
                {playMode === "bank"
                  ? bankValueLabel
                  : compactEffectOutcome}
              </p>
            ) : null}
          </div>
        ) : null}

        {playMode === "effect" && isCompactTargetChargeFlow ? (
          <div className="board-modal-sheet__body board-action-composer__section board-action-composer__target-section">
            <div className="board-action-composer__section-header">
              <p className="board-modal-sheet__eyebrow">Choose Opponent</p>
            </div>
            <div
              className="board-action-composer__target-list"
              role="radiogroup"
              aria-label="Choose opponent"
            >
              {targetOptions.map((option) => renderCompactTargetOption(option))}
            </div>
          </div>
        ) : null}

        {playMode === "effect" &&
        (firstMissingField ||
          isWildPropertyAssignment ||
          (canChooseBankOrEffect && !isCompactTargetChargeFlow && !missingSubmitField)) &&
        !isCompactTargetChargeFlow ? (
          <div
            className={`board-modal-sheet__body board-action-composer__section${
              isGuidedPropertyAction ? " board-action-composer__section--guided-property" : ""
            }${
              canChooseBankOrEffect ? " board-action-composer__section--compact-choice" : ""
            }`}
          >
            {actionOutcomeCopy && !isGuidedPropertyAction ? (
              <div className="board-action-composer__step-card">
                <div className="board-action-composer__section-header">
                  <p className="board-modal-sheet__eyebrow">Action Preview</p>
                  <h3>{meta.name}</h3>
                </div>
                <p className="board-modal-sheet__copy">{actionOutcomeCopy}</p>
              </div>
            ) : null}

            {meta.kind === "rent" && availableDoubleRentCount > 0 ? (
              <div className="board-action-composer__step-card">
                <div className="board-action-composer__section-header">
                  <p className="board-modal-sheet__eyebrow">Optional Boost</p>
                  <h3>Double The Rent</h3>
                </div>
                <p className="board-modal-sheet__copy">
                  Add one of your Double The Rent cards if you want to boost this charge.
                </p>
                <div className="board-option-list board-action-composer__step-options">
                  {Array.from({ length: availableDoubleRentCount + 1 }, (_, index) => {
                    const count = index;
                    const isActive = selectedDoubleRentCount === count;
                    const multiplier = 2 ** count;
                    return (
                      <button
                        key={`double-rent-${count}`}
                        type="button"
                        className={`board-option-list__item board-action-composer__step-option${
                          isActive ? " board-option-list__item--active" : ""
                        }`}
                        onClick={() => setDoubleRentCount(count)}
                      >
                        <span className="board-action-composer__choice-copy">
                          <strong>
                            {count === 0
                              ? "No boost"
                              : count === 1
                                ? "Use 1 Double The Rent"
                                : `Use ${count} Double The Rent cards`}
                          </strong>
                          <span>
                            {count === 0
                              ? "Charge the normal rent amount."
                              : `Multiply rent by ${multiplier}.`}
                          </span>
                        </span>
                        <span className="board-action-composer__choice-tag">x{multiplier}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="board-modal-sheet__meta">
                  {boostedRentAmount != null
                    ? `Charge preview: ${formatBankValue(baseRentAmount ?? 0)} x ${rentMultiplier} = ${formatBankValue(boostedRentAmount)}`
                    : "Choose a property set below to preview the final rent amount."}
                </p>
              </div>
            ) : null}

            {isWildPropertyAssignment || canChooseBankOrEffect ? null : renderProgressRail()}

            {canChooseBankOrEffect ? (
              renderCompactDecisionPanel()
            ) : isWildPropertyAssignment ? (
              <div className="board-action-composer__guided-panel board-action-composer__wild-panel">
                <div className="board-action-composer__guided-head">
                  <span className="board-action-composer__focus-step">Select one</span>
                  <h3>Pick a set</h3>
                  <p>Choose a set, then press Place Wild.</p>
                </div>
                <div
                  className="board-action-composer__decision-list board-action-composer__decision-list--wild"
                  role="radiogroup"
                  aria-label="Choose property set"
                >
                  {wildPropertyOptions.map((option) =>
                    renderDecisionOption("property_color", option),
                  )}
                </div>
              </div>
            ) : isGuidedPropertyAction ? (
              <div className="board-action-composer__guided-panel">
                <div className="board-action-composer__guided-head">
                  <span className="board-action-composer__focus-step">
                    Step {currentStepIndex + 1} of {fieldOrder.length}
                  </span>
                  <h3>{getGuidedStepTitle(firstMissingField)}</h3>
                  <p>{getGuidedStepDescription(firstMissingField)}</p>
                </div>
                {renderChosenTargetSummary()}
                <div className="board-action-composer__decision-list board-action-composer__decision-list--guided">
                  {options.map((option) => renderDecisionOption(firstMissingField, option))}
                </div>
              </div>
            ) : (
              <>
                {renderChosenTargetSummary()}
                <div className="board-action-composer__focus-card">
                  <div className="board-action-composer__focus-head">
                    <p className="board-modal-sheet__eyebrow">Current decision</p>
                    <span className="board-action-composer__focus-step">
                      Step {currentStepIndex + 1} of {fieldOrder.length}
                    </span>
                  </div>
                  <h3>{getFieldTitle(firstMissingField)}</h3>
                  <p className="board-modal-sheet__copy board-action-composer__focus-detail">
                    {getFieldDescription(firstMissingField)}
                  </p>
                  <p className="board-modal-sheet__meta board-action-composer__focus-instruction">
                    {getFieldInstruction(firstMissingField)}
                  </p>
                </div>

                <div className="board-action-composer__decision-list">
                  {options.map((option) => renderDecisionOption(firstMissingField, option))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {shouldRenderPropertyReadyEffect ? (
          <div className="board-modal-sheet__body board-action-composer__section board-action-composer__section--guided-property">
            {renderProgressRail()}
            {renderChosenTargetSummary()}
            <div className="board-action-composer__guided-panel board-action-composer__guided-panel--ready">
              <div className="board-action-composer__guided-head">
                <span className="board-action-composer__focus-step">Ready</span>
                <h3>Play {meta.name}</h3>
                <p>{actionOutcomeCopy ?? "All choices are set. Resolve the action."}</p>
              </div>
            </div>
          </div>
        ) : null}

        {shouldRenderGenericReadyEffect ? (
          <div
            className={`board-modal-sheet__body board-action-composer__section${
              isWildPropertyAssignment ? " board-action-composer__section--wild-ready" : ""
            }`}
          >
            {actionOutcomeCopy ? (
              <div className="board-action-composer__step-card">
                <div className="board-action-composer__section-header">
                  <p className="board-modal-sheet__eyebrow">Action Preview</p>
                  <h3>{meta.name}</h3>
                </div>
                <p className="board-modal-sheet__copy">{actionOutcomeCopy}</p>
              </div>
            ) : null}

            {meta.kind === "rent" && availableDoubleRentCount > 0 ? (
              <div className="board-action-composer__step-card">
                <div className="board-action-composer__section-header">
                  <p className="board-modal-sheet__eyebrow">Rent Total</p>
                  <h3>
                    {boostedRentAmount != null
                      ? formatBankValue(boostedRentAmount)
                      : "Choose a set"}
                  </h3>
                </div>
                <p className="board-modal-sheet__copy">
                  {boostedRentAmount != null
                    ? selectedDoubleRentCount > 0
                      ? `Base rent ${formatBankValue(baseRentAmount ?? 0)} boosted by x${rentMultiplier}.`
                      : `Base rent ${formatBankValue(baseRentAmount ?? 0)} with no modifier applied.`
                    : "Choose a property set to preview the total charge."}
                </p>
                <div className="board-option-list board-action-composer__step-options">
                  {Array.from({ length: availableDoubleRentCount + 1 }, (_, index) => {
                    const count = index;
                    const isActive = selectedDoubleRentCount === count;
                    const multiplier = 2 ** count;
                    return (
                      <button
                        key={`double-rent-ready-${count}`}
                        type="button"
                        className={`board-option-list__item board-action-composer__step-option${
                          isActive ? " board-option-list__item--active" : ""
                        }`}
                        onClick={() => setDoubleRentCount(count)}
                      >
                        <span className="board-action-composer__choice-copy">
                          <strong>
                            {count === 0
                              ? "No boost"
                              : count === 1
                                ? "Use 1 Double The Rent"
                                : `Use ${count} Double The Rent cards`}
                          </strong>
                          <span>
                            {count === 0
                              ? "Play the rent card as-is."
                              : `Multiply rent by ${multiplier}.`}
                          </span>
                        </span>
                        <span className="board-action-composer__choice-tag">x{multiplier}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isWildPropertyAssignment ? null : renderProgressRail()}

            <div className="board-action-composer__step-card">
              <div className="board-action-composer__section-header">
                <p className="board-modal-sheet__eyebrow">Ready</p>
                <h3>{isWildPropertyAssignment ? "Ready to place" : `Play ${meta.name}`}</h3>
              </div>
              <p className="board-modal-sheet__copy">
                {isWildPropertyAssignment
                  ? selectedWildPropertyLabel != null
                    ? `${selectedWildPropertyLabel} is selected. Press Place Wild to finish.`
                    : "Press Place Wild to finish."
                  : "All required choices are set. Submit to resolve the card."}
              </p>
            </div>
          </div>
        ) : null}

        {playMode === "bank" && !canChooseBankOrEffect ? (
          <div className="board-modal-sheet__body board-action-composer__section">
            <div className="board-action-composer__step-card">
              <div className="board-action-composer__section-header">
                <p className="board-modal-sheet__eyebrow">Bank Card</p>
                <h3>Bank {meta.name}</h3>
              </div>
              <p className="board-modal-sheet__copy">
                This will move the card into your bank for {formatBankValue(meta.moneyValue)}.
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}

        <div className="board-modal-sheet__footer">
          <button type="button" className="board-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="board-primary-button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {getPrimaryActionLabel()}
          </button>
        </div>
      </section>
    </div>
  );
}
