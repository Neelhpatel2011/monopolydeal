import { useMemo, useState } from "react";
import type { LocalBankCard, LocalPlayerState } from "../model/localPlayer";
import { formatBankValue, getBackendCardMeta } from "../../../integration/backend/catalog";

type PaymentFlowSheetProps = {
  amountDue: number;
  localPlayer: LocalPlayerState;
  sourcePlayerName?: string | null;
  sourceCardName?: string | null;
  onSubmit: (selection: {
    bank: string[];
    properties: string[];
    buildings: string[];
  }) => Promise<{
    status: "ok" | "error";
    message?: string | null;
  }>;
};

type SelectionState = {
  bank: string[];
  propertyTokens: string[];
  buildingTokens: string[];
};

type PaymentOption = {
  token: string;
  backendCardId: string;
  title: string;
  detail?: string;
  value: number;
  serialLabel?: string;
};

function getBankCardValue(card: LocalBankCard) {
  return getBackendCardMeta(card.backendCardId).moneyValue;
}

export function PaymentFlowSheet({
  amountDue,
  localPlayer,
  sourcePlayerName,
  sourceCardName,
  onSubmit,
}: PaymentFlowSheetProps) {
  const [selection, setSelection] = useState<SelectionState>({
      bank: [],
      propertyTokens: [],
      buildingTokens: [],
    });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bankOptions = useMemo<PaymentOption[]>(
    () => {
      const totals = new Map<string, number>();
      const seen = new Map<string, number>();

      for (const card of localPlayer.bankCards) {
        const key = `${card.backendCardId}|${getBankCardValue(card)}`;
        totals.set(key, (totals.get(key) ?? 0) + 1);
      }

      return localPlayer.bankCards.map((card, index) => {
        const value = getBankCardValue(card);
        const key = `${card.backendCardId}|${value}`;
        const ordinal = (seen.get(key) ?? 0) + 1;
        seen.set(key, ordinal);
        const totalCopies = totals.get(key) ?? 0;

        return {
          token: `${card.id}|${index}`,
          backendCardId: card.backendCardId,
          title: card.label,
          detail:
            totalCopies > 1
              ? `Bank copy ${ordinal} of ${totalCopies}`
              : "Bank card",
          value,
          serialLabel: totalCopies > 1 ? `${ordinal}/${totalCopies}` : undefined,
        };
      });
    },
    [localPlayer.bankCards],
  );
  const propertyOptions = useMemo<PaymentOption[]>(
    () =>
      localPlayer.propertySets.flatMap((set) =>
        set.cards.map((card) => {
          const meta = getBackendCardMeta(card.backendCardId);
          return {
            token: `${card.id}|${set.id}`,
            backendCardId: card.backendCardId,
            title: meta.name,
            detail: set.name,
            value: meta.moneyValue,
          };
        }),
      ),
    [localPlayer.propertySets],
  );
  const buildingOptions = useMemo<PaymentOption[]>(
    () =>
      localPlayer.propertySets.flatMap((set) =>
        (set.buildings ?? []).map((building, index) => {
          const cardId = building === "House" ? "action_house" : "action_hotel";
          return {
            token: `${cardId}|${set.id}|${index}`,
            backendCardId: cardId,
            title: building,
            detail: set.name,
            value: getBackendCardMeta(cardId).moneyValue,
          };
        }),
      ),
    [localPlayer.propertySets],
  );
  const bankOptionMap = useMemo(
    () => new Map(bankOptions.map((option) => [option.token, option])),
    [bankOptions],
  );
  const propertyOptionMap = useMemo(
    () => new Map(propertyOptions.map((option) => [option.token, option])),
    [propertyOptions],
  );
  const buildingOptionMap = useMemo(
    () => new Map(buildingOptions.map((option) => [option.token, option])),
    [buildingOptions],
  );

  const selectedTotal = useMemo(() => {
    const bankTotal = selection.bank.reduce(
      (total, token) => total + (bankOptionMap.get(token)?.value ?? 0),
      0,
    );
    const propertyTotal = selection.propertyTokens.reduce(
      (total, token) => total + (propertyOptionMap.get(token)?.value ?? 0),
      0,
    );
    const buildingTotal = selection.buildingTokens.reduce(
      (total, token) => total + (buildingOptionMap.get(token)?.value ?? 0),
      0,
    );
    return bankTotal + propertyTotal + buildingTotal;
  }, [
    bankOptionMap,
    buildingOptionMap,
    propertyOptionMap,
    selection.bank,
    selection.buildingTokens,
    selection.propertyTokens,
  ]);

  function toggleSelection(kind: keyof SelectionState, cardId: string) {
    setErrorMessage(null);
    setSelection((current) => ({
      ...current,
      [kind]: current[kind].includes(cardId)
        ? current[kind].filter((id) => id !== cardId)
        : [...current[kind], cardId],
    }));
  }

  const selectedBankIds = selection.bank
    .map((token) => bankOptionMap.get(token)?.backendCardId)
    .filter((cardId): cardId is string => Boolean(cardId));
  const selectedPropertyIds = selection.propertyTokens
    .map((token) => propertyOptionMap.get(token)?.backendCardId)
    .filter((cardId): cardId is string => Boolean(cardId));
  const selectedBuildingIds = selection.buildingTokens
    .map((token) => buildingOptionMap.get(token)?.backendCardId)
    .filter((cardId): cardId is string => Boolean(cardId));
  const remainingAmount = Math.max(amountDue - selectedTotal, 0);
  const overpayAmount = Math.max(selectedTotal - amountDue, 0);
  const hasAnyPayableCards =
    bankOptions.length > 0 || propertyOptions.length > 0 || buildingOptions.length > 0;

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onSubmit({
        bank: selectedBankIds,
        properties: selectedPropertyIds,
        buildings: selectedBuildingIds,
      });

      if (result.status === "error") {
        setErrorMessage(result.message ?? "Payment could not be submitted.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderOptionButton(
    kind: keyof SelectionState,
    option: PaymentOption,
    isSelected: boolean,
  ) {
    return (
      <button
        key={option.token}
        type="button"
        aria-pressed={isSelected}
        className={`payment-flow-sheet__option-button${
          isSelected ? " payment-flow-sheet__option-button--selected" : ""
        }`}
        onClick={() => toggleSelection(kind, option.token)}
      >
        <span className="payment-flow-sheet__option-main">
          <span className="payment-flow-sheet__option-copy">
            <strong className="payment-flow-sheet__option-label">{option.title}</strong>
            {option.detail ? (
              <span className="payment-flow-sheet__option-detail">{option.detail}</span>
            ) : null}
          </span>
        </span>
        <span className="payment-flow-sheet__option-side">
          {option.serialLabel ? (
            <span className="payment-flow-sheet__option-serial">{option.serialLabel}</span>
          ) : null}
          <strong className="payment-flow-sheet__option-value">
            {formatBankValue(option.value)}
          </strong>
          <span className="payment-flow-sheet__option-pill" aria-hidden="true">
            {isSelected ? "In" : "Add"}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="board-modal-overlay" role="presentation">
      <section
        className="board-modal-sheet payment-flow-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Payment required"
      >
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Payment Required</p>
            <h2>Pay {formatBankValue(amountDue)}</h2>
          </div>
        </div>
        <div className="board-modal-sheet__body payment-flow-sheet__intro">
          {sourcePlayerName || sourceCardName ? (
            <p className="board-modal-sheet__copy">
              {sourcePlayerName ?? "Another player"} played {sourceCardName ?? "a charge card"}.
            </p>
          ) : null}
          <p className="board-modal-sheet__copy">
            {hasAnyPayableCards
              ? `Tap cards to cover ${formatBankValue(amountDue)}.`
              : "You have nothing to pay. Submit $0M to continue."}
          </p>
        </div>

        <div className="payment-flow-sheet__summary">
          <div className="payment-flow-sheet__stat">
            <span>Due</span>
            <strong>{formatBankValue(remainingAmount)}</strong>
          </div>
          <div className="payment-flow-sheet__stat">
            <span>Selected</span>
            <strong>{formatBankValue(selectedTotal)}</strong>
          </div>
          <div className="payment-flow-sheet__stat">
            <span>Overpay</span>
            <strong>{formatBankValue(overpayAmount)}</strong>
          </div>
        </div>

        <div className="payment-flow-sheet__content">
          <section className="payment-flow-sheet__section">
            <div className="payment-flow-sheet__section-header">
              <h3>Bank</h3>
              <span>{bankOptions.length}</span>
            </div>
            <div className="board-check-list payment-flow-sheet__list">
              {bankOptions.length > 0 ? (
                bankOptions.map((option) =>
                  renderOptionButton("bank", option, selection.bank.includes(option.token)),
                )
              ) : (
                <p className="payment-flow-sheet__empty">No bank cards available.</p>
              )}
            </div>
          </section>

          <section className="payment-flow-sheet__section">
            <div className="payment-flow-sheet__section-header">
              <h3>Properties</h3>
              <span>{propertyOptions.length}</span>
            </div>
            <div className="board-check-list payment-flow-sheet__list">
              {propertyOptions.length > 0 ? (
                propertyOptions.map((option) =>
                  renderOptionButton(
                    "propertyTokens",
                    option,
                    selection.propertyTokens.includes(option.token),
                  ),
                )
              ) : (
                <p className="payment-flow-sheet__empty">No properties available.</p>
              )}
            </div>
          </section>

          <section className="payment-flow-sheet__section">
            <div className="payment-flow-sheet__section-header">
              <h3>Buildings</h3>
              <span>{buildingOptions.length}</span>
            </div>
            <div className="board-check-list payment-flow-sheet__list">
              {buildingOptions.length > 0 ? (
                buildingOptions.map((option) =>
                  renderOptionButton(
                    "buildingTokens",
                    option,
                    selection.buildingTokens.includes(option.token),
                  ),
                )
              ) : (
                <p className="payment-flow-sheet__empty">No buildings available.</p>
              )}
            </div>
          </section>
        </div>

        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}

        <div className="board-modal-sheet__footer payment-flow-sheet__footer">
          <div className="payment-flow-sheet__status">
            <strong>
              {hasAnyPayableCards
                ? selectedTotal >= amountDue
                  ? overpayAmount > 0
                    ? `Selected ${formatBankValue(selectedTotal)}. Overpay ${formatBankValue(overpayAmount)}.`
                    : `${formatBankValue(amountDue)} covered.`
                  : `${formatBankValue(remainingAmount)} still needed`
                : "Nothing to pay"}
            </strong>
            <span className="board-modal-sheet__meta">
              {hasAnyPayableCards
                ? "You can overpay if needed."
                : "Submit to resolve the payment with $0M."}
            </span>
          </div>
          <button
            type="button"
            className="board-primary-button"
            disabled={isSubmitting || (hasAnyPayableCards && selectedTotal <= 0)}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Submitting..." : "Submit Payment"}
          </button>
        </div>
      </section>
    </div>
  );
}
