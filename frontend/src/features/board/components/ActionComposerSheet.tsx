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
  const baseRentAmount = selectedPropertySet?.currentRentAmount ?? null;
  const rentMultiplier = 2 ** selectedDoubleRentCount;
  const boostedRentAmount = baseRentAmount != null ? baseRentAmount * rentMultiplier : null;

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

  const chosenStealCardLabel =
    chosenStealCardId != null
      ? getChosenOption("steal_card_id", chosenStealCardId)?.label ?? chosenStealCardId
      : null;
  const chosenGiveCardLabel =
    chosenGiveCardId != null
      ? getChosenOption("give_card_id", chosenGiveCardId)?.label ?? chosenGiveCardId
      : null;

  const actionOutcomeCopy = useMemo(() => {
    if (meta.effectType === "steal_property" && chosenTargetPlayerId && chosenStealCardLabel) {
      return `You will steal ${chosenStealCardLabel} from ${chosenTargetPlayerId}.`;
    }

    if (
      meta.effectType === "swap_property" &&
      chosenTargetPlayerId &&
      chosenStealCardLabel &&
      chosenGiveCardLabel
    ) {
      return `You will take ${chosenStealCardLabel} from ${chosenTargetPlayerId} and give ${chosenGiveCardLabel} in return.`;
    }

    if (meta.effectType === "swap_property" && chosenTargetPlayerId && chosenStealCardLabel) {
      return `You are taking ${chosenStealCardLabel} from ${chosenTargetPlayerId}. Now choose what you will give back.`;
    }

    if (meta.effectType === "steal_property" && chosenTargetPlayerId) {
      return `Targeting ${chosenTargetPlayerId}. Next choose which property you want to steal.`;
    }

    if (meta.effectType === "swap_property" && chosenTargetPlayerId) {
      return `Targeting ${chosenTargetPlayerId}. Next choose the property you want to take.`;
    }

    return null;
  }, [
    chosenGiveCardLabel,
    chosenStealCardLabel,
    chosenTargetPlayerId,
    meta.effectType,
  ]);

  function getFieldTitle(field: ActionFieldKey) {
    switch (field) {
      case "target_player_id":
        return "Choose a target player";
      case "steal_color":
        return chosenTargetPlayerId
          ? `Choose a full set from ${chosenTargetPlayerId}`
          : "Choose a full set";
      case "steal_card_id":
        if (meta.effectType === "swap_property") {
          return chosenTargetPlayerId
            ? `Choose the property to take from ${chosenTargetPlayerId}`
            : "Choose the property you want to take";
        }
        return chosenTargetPlayerId
          ? `Choose the property to steal from ${chosenTargetPlayerId}`
          : "Choose a property to steal";
      case "give_card_id":
        return chosenTargetPlayerId
          ? `Choose the property you will give ${chosenTargetPlayerId}`
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
      <div className="board-action-composer__progress" aria-label="Action progress">
        {fieldOrder.map((field, index) => {
          const status = getStepStatus(field);
          const chosenValue = draftIntent.chosen[field];

          return (
            <div
              key={field}
              className={`board-action-composer__progress-step board-action-composer__progress-step--${status}`}
            >
              <span className="board-action-composer__progress-marker" aria-hidden="true">
                {status === "complete" ? "OK" : index + 1}
              </span>

              <span className="board-action-composer__progress-copy">
                <strong>{getFieldSummaryLabel(field)}</strong>
                <span className="board-action-composer__progress-value">
                  {typeof chosenValue === "string"
                    ? formatChosenValue(field, chosenValue)
                    : status === "current"
                      ? "Choose this next"
                      : "Waiting"}
                </span>
              </span>

              {status === "complete" ? (
                <button
                  type="button"
                  className="board-action-composer__progress-action"
                  onClick={() => handleResetFromField(field)}
                >
                  Change
                </button>
              ) : (
                <span
                  className={`board-action-composer__progress-pill board-action-composer__progress-pill--${status}`}
                >
                  {status === "current" ? "Now" : "Next"}
                </span>
              )}
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
    const detailCopy =
      option.detail ??
      (isTargetOption
        ? opponent != null
          ? `${opponent.handCount} cards in hand - ${opponent.bankTotal} bank`
          : "Choose this player as the target."
        : localSetSummary != null
          ? `${localSetSummary.count}/${localSetSummary.targetSize} cards - Rent ${localSetSummary.currentRentLabel}`
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
        }`}
        onClick={() =>
          setDraftIntent((current) => applyChosenValue(current, field, option.value))
        }
      >
        <span className="board-action-composer__decision-leading">
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

          <span className="board-action-composer__decision-copy">
            <strong>{option.label}</strong>
            <span className="board-action-composer__decision-detail">{detailCopy}</span>
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
          <span className="board-action-composer__decision-cta">Choose</span>
        </span>
      </button>
    );
  }

  async function handleSubmit() {
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

  return (
    <div className="board-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="board-modal-sheet board-action-composer"
        role="dialog"
        aria-modal="true"
        aria-label={`${card.label} options`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">
              {meta.kind === "rent" ? "Rent Card" : "Action Card"}
            </p>
            <h2>{meta.name}</h2>
            <p className="board-modal-sheet__copy board-action-composer__headline">
              {canChooseBankOrEffect
                ? `Play the effect or bank this card for ${formatBankValue(meta.moneyValue)}.`
                : `Follow the guided sequence below to resolve ${meta.name}.`}
            </p>
          </div>
          <button type="button" className="board-modal-sheet__close" onClick={onClose}>
            X
          </button>
        </div>

        {canChooseBankOrEffect ? (
          <div className="board-modal-sheet__body board-action-composer__section">
            <div className="board-action-composer__section-header">
              <p className="board-modal-sheet__eyebrow">Use Card As</p>
            </div>
            <div className="board-option-list board-action-composer__choice-list">
              <button
                type="button"
                className={`board-option-list__item${
                  playMode === "effect" ? " board-option-list__item--active" : ""
                } board-action-composer__choice board-action-composer__mode-card`}
                onClick={() => {
                  setPlayMode("effect");
                  setErrorMessage(null);
                }}
              >
                <span className="board-action-composer__choice-copy">
                  <strong>Play effect</strong>
                  <span className="board-action-composer__choice-detail">
                    Resolve the full effect for {meta.name}.
                  </span>
                </span>
                <span className="board-action-composer__choice-tag">Action</span>
              </button>
              <button
                type="button"
                className={`board-option-list__item${
                  playMode === "bank" ? " board-option-list__item--active" : ""
                } board-action-composer__choice board-action-composer__mode-card`}
                onClick={() => {
                  setPlayMode("bank");
                  setErrorMessage(null);
                }}
              >
                <span className="board-action-composer__choice-copy">
                  <strong>Bank card</strong>
                  <span className="board-action-composer__choice-detail">
                    Commit this card to your bank.
                  </span>
                </span>
                <span className="board-action-composer__choice-tag">
                  {formatBankValue(meta.moneyValue)}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {playMode === "effect" && firstMissingField ? (
          <div className="board-modal-sheet__body board-action-composer__section">
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

            {renderProgressRail()}

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
          </div>
        ) : null}

        {playMode === "effect" && !firstMissingField ? (
          <div className="board-modal-sheet__body board-action-composer__section">
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

            {renderProgressRail()}

            <div className="board-action-composer__step-card">
              <div className="board-action-composer__section-header">
                <p className="board-modal-sheet__eyebrow">Ready</p>
                <h3>Play {meta.name}</h3>
              </div>
              <p className="board-modal-sheet__copy">
                All required choices are set. Submit to resolve the card.
              </p>
            </div>
          </div>
        ) : null}

        {playMode === "bank" ? (
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
            disabled={submitIntent.missing.length > 0 || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting
              ? "Submitting..."
              : playMode === "bank"
                ? `Bank ${formatBankValue(meta.moneyValue)}`
                : `Play ${meta.name}`}
          </button>
        </div>
      </section>
    </div>
  );
}
