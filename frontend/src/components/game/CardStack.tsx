'use client'

import CardBack from '@/components/CardBack'
import { CatalogCard } from '@/components/game/CatalogCard'

interface CardStackProps {
  label: string
  count: number
  topCardId?: string | null
  mode?: 'deck' | 'discard'
}

export function CardStack({
  label,
  count,
  topCardId = null,
  mode = 'deck',
}: CardStackProps) {
  const showCardBack = mode === 'deck' || !topCardId

  return (
    <div className={`card-stack card-stack-${mode}`}>
      <span className="card-stack-label">{label}</span>

      <div className="card-stack-shell" aria-label={`${label} pile`}>
        <span className="card-stack-layer card-stack-layer-back" aria-hidden="true" />
        <span className="card-stack-layer card-stack-layer-mid" aria-hidden="true" />

        <div className="card-stack-face">
          {showCardBack ? (
            <CardBack />
          ) : (
            <CatalogCard cardId={topCardId} size="fill" />
          )}
        </div>

        <span className="card-stack-badge">{count}</span>
      </div>

      <span className="card-stack-foot">{label}</span>
    </div>
  )
}
