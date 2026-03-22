'use client'

import { useDroppable } from '@dnd-kit/core'
import { CatalogCard } from '@/components/game/CatalogCard'
import { sumBankValue } from '@/data/cardCatalog'
import { useGame } from '@/contexts/GameContext'

interface BankPocketProps {
  bankIds: string[]
}

export function BankPocket({ bankIds }: BankPocketProps) {
  const { isMyTurn } = useGame()
  const { setNodeRef, isOver } = useDroppable({
    id: 'bank-drop',
    disabled: !isMyTurn,
  })
  const bankTotal = sumBankValue(bankIds)

  return (
    <section
      ref={setNodeRef}
      className={[
        'bank-pocket',
        isOver ? 'bank-pocket-over' : '',
      ].filter(Boolean).join(' ')}
      aria-label="Your bank"
    >
      <div className="bank-pocket-head">
        <span className="bank-pocket-kicker">Bank</span>
        <span className="bank-pocket-total">${bankTotal}M</span>
      </div>

      <div className="bank-pocket-body">
        {bankIds.length > 0 ? (
          <div className="bank-pocket-fan">
            {bankIds.slice(0, 4).map((cardId, index) => (
              <div
                key={`${cardId}-${index}`}
                className="bank-pocket-card"
                style={{
                  transform: `translateX(${index * 10}px) translateY(${index * 8}px) rotate(${(index - 1.5) * 8}deg)`,
                  zIndex: 10 + index,
                }}
              >
                <CatalogCard cardId={cardId} size="md" />
              </div>
            ))}
            {bankIds.length > 4 && <span className="bank-pocket-more">+{bankIds.length - 4}</span>}
          </div>
        ) : (
          <div className="bank-pocket-empty">
            <div className="bank-pocket-empty-visual" aria-hidden="true">
              <span className="bank-pocket-empty-slip bank-pocket-empty-slip-a" />
              <span className="bank-pocket-empty-slip bank-pocket-empty-slip-b" />
              <span className="bank-pocket-empty-slip bank-pocket-empty-slip-c" />
              <span className="bank-pocket-empty-token">$</span>
            </div>
            <span className="bank-pocket-empty-title">Drop money or actions here</span>
            <span className="bank-pocket-empty-sub">Properties cannot be banked.</span>
          </div>
        )}
      </div>
    </section>
  )
}
