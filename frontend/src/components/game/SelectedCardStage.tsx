'use client'

import CardBack from '@/components/CardBack'
import { CatalogCard } from '@/components/game/CatalogCard'
import { getCard } from '@/data/cardCatalog'

interface SelectedCardStageProps {
  selectedCardId: string | null
  activeCardId: string | null
  targetPlayerId: string | null
  turnActionsCount: number
  isMyTurn: boolean
}

const TARGETED_CARD_IDS = new Set([
  'action_debt_collector',
  'action_sly_deal',
  'action_forced_deal',
  'action_deal_breaker',
  'multicolor_rent',
  'multicolor_rent_2',
  'multicolor_rent_3',
])

function getInstructionText(selectedCardId: string | null, targetPlayerId: string | null, isMyTurn: boolean) {
  if (!isMyTurn) return 'Watching the board'
  if (!selectedCardId) return 'Choose a card from hand'
  if (TARGETED_CARD_IDS.has(selectedCardId) && !targetPlayerId) return 'Choose a Target'
  return 'Ready to Resolve'
}

export function SelectedCardStage({
  selectedCardId,
  activeCardId,
  targetPlayerId,
  turnActionsCount,
  isMyTurn,
}: SelectedCardStageProps) {
  const displayCardId = selectedCardId ?? activeCardId
  const displayCard = displayCardId ? getCard(displayCardId) : null
  const selectedCard = selectedCardId ? getCard(selectedCardId) : null
  const instructionText = getInstructionText(selectedCardId, targetPlayerId, isMyTurn)
  const statusText = selectedCard
    ? `Selected / ${selectedCard.name}`
    : displayCard
      ? `On Table / ${displayCard.name}`
      : 'Center Stage / Waiting'

  return (
    <section className="selected-stage" aria-label="Action and selected card area">
      <div className="selected-stage-head">
        <span className="selected-stage-kicker">Action / Selected Card</span>
        <span className="selected-stage-state">{statusText}</span>
      </div>

      <div className="selected-stage-instruction">{instructionText}</div>

      <div className="selected-stage-platform">
        <div className="selected-stage-shadow" aria-hidden="true" />
        <div className="selected-stage-card">
          {displayCardId ? (
            <CatalogCard cardId={displayCardId} size="fill" />
          ) : (
            <div className="selected-stage-idle">
              <CardBack />
            </div>
          )}
        </div>
      </div>

      <div className="selected-stage-caption">
        {displayCard ? (
          <>
            <span className="selected-stage-title">{displayCard.name}</span>
            <span className="selected-stage-sub">
              {selectedCard
                ? 'Selected from your hand'
                : turnActionsCount > 0
                  ? 'Latest action played this turn'
                  : 'Awaiting the first play'} / ${displayCard.bankValue}M bank value
            </span>
          </>
        ) : (
          <span className="selected-stage-sub">Play a card to begin your turn plan.</span>
        )}
      </div>
    </section>
  )
}
