import { useMemo, useState } from "react";
import type { LocalBankCard, LocalPlayerState } from "../model/localPlayer";
import { formatBankValue, getBackendCardMeta } from "../../../integration/backend/catalog";

type PaymentFlowSheetProps = {
  amountDue: number;
  localPlayer: LocalPlayerState;
  onSubmit: (selection: {
    bank: string[];
    properties: string[];
    buildings: string[];
  }) => Promise<unknown>;
};

type SelectionState = {
  bank: string[];
  properties: string[];
  buildingTokens: string[];
};

function getBankCardValue(card: LocalBankCard) {
  return getBackendCardMeta(card.backendCardId).moneyValue;
}

export function PaymentFlowSheet({ amountDue, localPlayer, onSubmit }: PaymentFlowSheetProps) {
  const [selection, setSelection] = useState<SelectionState>({
      bank: [],
      properties: [],
      buildingTokens: [],
    });

  const selectedTotal = useMemo(() => {
    const bankTotal = selection.bank.reduce(
      (total, cardId) => total + getBackendCardMeta(cardId).moneyValue,
      0,
    );
    const propertyTotal = selection.properties.reduce(
      (total, cardId) => total + getBackendCardMeta(cardId).moneyValue,
      0,
    );
    const buildingTotal = selection.buildingTokens.reduce(
      (total, token) => total + getBackendCardMeta(token.split("|")[0]).moneyValue,
      0,
    );
    return bankTotal + propertyTotal + buildingTotal;
  }, [selection.bank, selection.buildingTokens, selection.properties]);

  function toggleSelection(kind: keyof SelectionState, cardId: string) {
    setSelection((current) => ({
      ...current,
      [kind]: current[kind].includes(cardId)
        ? current[kind].filter((id) => id !== cardId)
        : [...current[kind], cardId],
    }));
  }

  const selectedBuildingIds = selection.buildingTokens.map((token) => token.split("|")[0]);
  const hasAnyPayableCards =
    localPlayer.bankCards.length > 0 ||
    localPlayer.propertySets.some((set) => set.cards.length > 0 || (set.buildings?.length ?? 0) > 0);

  return (
    <div className="board-modal-overlay" role="presentation">
      <section className="board-modal-sheet" role="dialog" aria-modal="true" aria-label="Payment required">
        <div className="board-modal-sheet__header">
          <div>
            <p className="board-modal-sheet__eyebrow">Payment Required</p>
            <h2>Pay {formatBankValue(amountDue)}</h2>
          </div>
        </div>

        <div className="board-check-section">
          <h3>Bank</h3>
          <div className="board-check-list">
            {localPlayer.bankCards.map((card) => (
              <label key={card.id} className="board-check-list__item">
                <input
                  type="checkbox"
                  checked={selection.bank.includes(card.backendCardId)}
                  onChange={() => toggleSelection("bank", card.backendCardId)}
                />
                <span>{card.label} {formatBankValue(getBankCardValue(card))}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="board-check-section">
          <h3>Properties</h3>
          <div className="board-check-list">
            {localPlayer.propertySets.flatMap((set) =>
              set.cards.map((card) => (
                <label key={card.id} className="board-check-list__item">
                  <input
                    type="checkbox"
                    checked={selection.properties.includes(card.backendCardId)}
                    onChange={() => toggleSelection("properties", card.backendCardId)}
                  />
                  <span>
                    {set.name}: {getBackendCardMeta(card.backendCardId).name}{" "}
                    {formatBankValue(getBackendCardMeta(card.backendCardId).moneyValue)}
                  </span>
                </label>
              )),
            )}
          </div>
        </div>

        <div className="board-check-section">
          <h3>Buildings</h3>
          <div className="board-check-list">
            {localPlayer.propertySets.flatMap((set) =>
              (set.buildings ?? []).map((building, index) => {
                const cardId = building === "House" ? "action_house" : "action_hotel";
                return (
                  <label key={`${set.id}:${building}:${index}`} className="board-check-list__item">
                    <input
                      type="checkbox"
                    checked={selection.buildingTokens.includes(`${cardId}|${set.id}|${index}`)}
                    onChange={() => toggleSelection("buildingTokens", `${cardId}|${set.id}|${index}`)}
                  />
                    <span>
                      {set.name}: {building} {formatBankValue(getBackendCardMeta(cardId).moneyValue)}
                    </span>
                  </label>
                );
              }),
            )}
          </div>
        </div>

        <div className="board-modal-sheet__footer">
          <span className="board-modal-sheet__meta">Selected {formatBankValue(selectedTotal)}</span>
          <button
            type="button"
            className="board-primary-button"
            disabled={hasAnyPayableCards && selectedTotal <= 0}
            onClick={() =>
              void onSubmit({
                bank: selection.bank,
                properties: selection.properties,
                buildings: selectedBuildingIds,
              })
            }
          >
            Submit Payment
          </button>
        </div>
      </section>
    </div>
  );
}
