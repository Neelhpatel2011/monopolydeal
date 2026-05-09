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

type PaymentGroup = {
  key: keyof SelectionState;
  title: string;
  options: PaymentOption[];
  selectedTokens: string[];
  emptyLabel: string;
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
  const paymentSourceLabel = [sourcePlayerName, sourceCardName].filter(Boolean).join(" - ");
  const paymentGroups: PaymentGroup[] = [
    {
      key: "bank",
      title: "Bank",
      options: bankOptions,
      selectedTokens: selection.bank,
      emptyLabel: "No bank cards available.",
    },
    {
      key: "propertyTokens",
      title: "Properties",
      options: propertyOptions,
      selectedTokens: selection.propertyTokens,
      emptyLabel: "No properties available.",
    },
    {
      key: "buildingTokens",
      title: "Buildings",
      options: buildingOptions,
      selectedTokens: selection.buildingTokens,
      emptyLabel: "No buildings available.",
    },
  ];
  const visiblePaymentGroups = paymentGroups.filter((group) => group.options.length > 0);
  const paymentStatusTitle = hasAnyPayableCards
    ? selectedTotal <= 0
      ? "Choose cards"
      : selectedTotal >= amountDue
        ? overpayAmount > 0
          ? `Overpay ${formatBankValue(overpayAmount)}`
          : "Ready"
        : `${formatBankValue(remainingAmount)} short`
    : "Nothing to pay";
  const paymentStatusDetail = hasAnyPayableCards
    ? `${formatBankValue(selectedTotal)} / ${formatBankValue(amountDue)}`
    : "$0M";
  const submitLabel = isSubmitting
    ? "Submitting..."
    : hasAnyPayableCards
      ? selectedTotal > 0
        ? `Submit ${formatBankValue(selectedTotal)}`
        : "Submit Payment"
      : "Submit $0M";
  const progressRatio =
    amountDue > 0 ? Math.min(selectedTotal / amountDue, 1) : hasAnyPayableCards ? 1 : 0;

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
        aria-label={`${isSelected ? "Remove" : "Add"} ${option.title}${
          option.detail ? `, ${option.detail}` : ""
        }, ${formatBankValue(option.value)}`}
        className={`payment-flow-sheet__option-button${
          isSelected ? " payment-flow-sheet__option-button--selected" : ""
        }`}
        onClick={() => toggleSelection(kind, option.token)}
      >
        <span className="payment-flow-sheet__option-check" aria-hidden="true">
          {isSelected ? "\u2713" : ""}
        </span>
        <span className="payment-flow-sheet__option-main">
          <span className="payment-flow-sheet__option-copy">
            <strong className="payment-flow-sheet__option-label">{option.title}</strong>
          </span>
        </span>
        <span className="payment-flow-sheet__option-side">
          {option.serialLabel ? (
            <span className="payment-flow-sheet__option-serial">{option.serialLabel}</span>
          ) : null}
          <strong className="payment-flow-sheet__option-value">
            {formatBankValue(option.value)}
          </strong>
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
            <h2>Pay {formatBankValue(amountDue)}</h2>
            {paymentSourceLabel ? (
              <p className="payment-flow-sheet__source">{paymentSourceLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="payment-flow-sheet__summary" aria-live="polite">
          <div className="payment-flow-sheet__summary-copy">
            <strong>{paymentStatusTitle}</strong>
            <span>{paymentStatusDetail}</span>
          </div>
          <div className="payment-flow-sheet__progress" aria-hidden="true">
            <span style={{ width: `${progressRatio * 100}%` }} />
          </div>
        </div>

        <div className="payment-flow-sheet__content">
          {visiblePaymentGroups.length > 0 ? (
            visiblePaymentGroups.map((group) => (
              <section className="payment-flow-sheet__section" key={group.key}>
                <div className="payment-flow-sheet__section-header">
                  <h3>{group.title}</h3>
                </div>
                <div className="board-check-list payment-flow-sheet__list">
                  {group.options.map((option) =>
                    renderOptionButton(
                      group.key,
                      option,
                      group.selectedTokens.includes(option.token),
                    ),
                  )}
                </div>
              </section>
            ))
          ) : (
            <p className="payment-flow-sheet__empty">
              {paymentGroups.find((group) => group.options.length === 0)?.emptyLabel ??
                "No payable cards available."}
            </p>
          )}
        </div>

        {errorMessage ? <p className="board-modal-sheet__alert">{errorMessage}</p> : null}

        <div className="board-modal-sheet__footer payment-flow-sheet__footer">
          <button
            type="button"
            className="board-primary-button"
            disabled={isSubmitting || (hasAnyPayableCards && selectedTotal <= 0)}
            onClick={() => void handleSubmit()}
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
