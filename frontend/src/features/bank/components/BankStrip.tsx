import type { CSSProperties } from "react";
import type { LocalBankCard } from "../../board/model/localPlayer";
import { LOCAL_BANK_TARGET_ID } from "../../drag-targeting/model/target-preview";
import { BoardMicroCard } from "../../../components/cards/BoardMicroCard";
import { getBankRenderCard } from "../../../components/cards/boardCardAdapters";
import { boardCardSurfacePresets } from "../../../components/cards/boardCardSurfaces";

type BankStripProps = {
  cards: LocalBankCard[];
  total: string;
  isTargetable?: boolean;
  isPreviewed?: boolean;
  isInvalid?: boolean;
};

export function BankStrip({
  cards,
  total,
  isTargetable = false,
  isPreviewed = false,
  isInvalid = false,
}: BankStripProps) {
  const surfacePreset = boardCardSurfacePresets.bank;

  return (
    <section
      className={`bank-strip${isTargetable ? " bank-strip--targetable" : ""}${
        isPreviewed ? " bank-strip--previewed" : ""
      }${
        isInvalid ? " bank-strip--invalid" : ""
      }`}
      aria-label="Banked cards"
      data-board-target-id={LOCAL_BANK_TARGET_ID}
    >
      <div className="bank-strip__header">
        <div>
          <p className="bank-strip__eyebrow">Bank</p>
          <h3>{total}</h3>
        </div>
        <p className="bank-strip__summary">{cards.length} cards</p>
      </div>

      <div className="bank-strip__cards">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="bank-note"
            aria-label={`${card.amount} ${card.label}`}
            style={{ "--bank-index": index } as CSSProperties}
          >
            {surfacePreset.renderMode === "micro" ? (
              <BoardMicroCard
                card={getBankRenderCard(card)}
                className="bank-note__micro-card"
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
