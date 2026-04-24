import { useState } from "react";
import type { LocalBankCard } from "../../board/model/localPlayer";
import { LOCAL_BANK_TARGET_ID } from "../../drag-targeting/model/target-preview";
import { ScaledMonopolyCard } from "../../../components/cards/ScaledMonopolyCard";
import { getBankRenderCard } from "../../../components/cards/boardCardAdapters";
import { boardCardSurfacePresets } from "../../../components/cards/boardCardSurfaces";
import { BankDetailSheet } from "./BankDetailSheet";

type BankStripProps = {
  cards: LocalBankCard[];
  total: string;
  isTargetable?: boolean;
  isPreviewed?: boolean;
  isInvalid?: boolean;
  onTargetPress?: () => void;
};

export function BankStrip({
  cards,
  total,
  isTargetable = false,
  isPreviewed = false,
  isInvalid = false,
  onTargetPress,
}: BankStripProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const surfacePreset = boardCardSurfacePresets.bank;
  const interactionLocked = isTargetable || isPreviewed || isInvalid;

  return (
    <>
      <section
        className={`bank-strip${isTargetable ? " bank-strip--targetable" : ""}${
          isPreviewed ? " bank-strip--previewed" : ""
        }${
          isInvalid ? " bank-strip--invalid" : ""
        }`}
        aria-label="Banked cards"
        data-board-target-id={LOCAL_BANK_TARGET_ID}
      >
        <button
          type="button"
          className="bank-strip__button"
          aria-label="Open bank details"
          aria-disabled={interactionLocked}
          data-board-target-id={LOCAL_BANK_TARGET_ID}
          onClick={() => {
            if (isTargetable && onTargetPress) {
              onTargetPress();
              return;
            }

            if (!interactionLocked) {
              setIsDetailOpen(true);
            }
          }}
        >
          <div className="bank-strip__header">
            <div>
              <p className="bank-strip__eyebrow">Bank</p>
              <h3>{total}</h3>
            </div>
            <p className="bank-strip__summary">{cards.length} cards</p>
          </div>

          <div className="bank-strip__cards">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bank-note"
                aria-label={`${card.amount} ${card.label}`}
              >
                {surfacePreset.renderMode === "full" ? (
                  <ScaledMonopolyCard
                    card={getBankRenderCard(card)}
                    size={surfacePreset.size}
                    scale={surfacePreset.scale}
                    className="bank-note__scaled-card"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </button>
      </section>

      {isDetailOpen ? (
        <BankDetailSheet
          cards={cards}
          total={total}
          onClose={() => setIsDetailOpen(false)}
        />
      ) : null}
    </>
  );
}
