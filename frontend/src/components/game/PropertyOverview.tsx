'use client'

import { useDroppable } from '@dnd-kit/core'
import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'
import { PROPERTY_OVERVIEW_COLUMNS } from '@/components/game/boardUtils'
import { useGame } from '@/contexts/GameContext'
import { getCard, groupColorMap, groupDisplayNames, groupSetSizes } from '@/data/cardCatalog'

interface PropertyOverviewProps {
  properties: Record<string, string[]>
  buildings: Record<string, string[]>
  showNewSetDropZones: boolean
}

interface PropertyOverviewSlotProps {
  color: string
  cardIds: string[]
  buildingIds: string[]
  showNewSetDropZone: boolean
}

function PropertyOverviewSlot({
  color,
  cardIds,
  buildingIds,
  showNewSetDropZone,
}: PropertyOverviewSlotProps) {
  const { state, dispatch, playAction, isMyTurn, actionsLeft } = useGame()
  const isOccupied = cardIds.length > 0
  const setSize = groupSetSizes[color] ?? 3
  const isComplete = cardIds.length >= setSize
  const dropEnabled = isOccupied || showNewSetDropZone
  const { setNodeRef, isOver } = useDroppable({
    id: `${isOccupied ? 'prop-set' : 'new-set'}-${color}`,
    disabled: !dropEnabled,
  })
  const canChangeWild = isMyTurn && actionsLeft > 0 && !state.loading
  const fillPercent = Math.min(100, (cardIds.length / setSize) * 100)

  return (
    <div
      ref={setNodeRef}
      className={[
        'property-overview-slot',
        isOccupied ? 'property-overview-slot-occupied' : '',
        isComplete ? 'property-overview-slot-complete' : '',
        isOver ? 'property-overview-slot-over' : '',
        !dropEnabled ? 'property-overview-slot-disabled' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="property-overview-slot-head">
        <span className={`property-overview-slot-chip ${groupColorMap[color]?.color ?? 'bg-gray-600'}`} />
        <span className="property-overview-slot-name">{groupDisplayNames[color] ?? color}</span>
        <span className="property-overview-slot-count">{cardIds.length}/{setSize}</span>
      </div>

      <div className="property-overview-slot-track">
        <div
          className={`property-overview-slot-fill ${groupColorMap[color]?.color ?? 'bg-gray-600'}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className="property-overview-slot-stack">
        {isOccupied ? (
          <>
            {cardIds.slice(0, 4).map((cardId, index) => {
              const card = getCard(cardId)
              const isWild = card.kind === 'property_wild'
              const allowedColors = card.wildColors ?? []
              const clickable = canChangeWild && isWild && allowedColors.length > 0

              if (clickable) {
                return (
                  <button
                    key={`${cardId}-${index}`}
                    type="button"
                    className="property-overview-card-button"
                    title={`Change wild color: ${card.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      dispatch({
                        type: 'SET_CHOICE_MODAL',
                        modal: {
                          mode: 'choose_color',
                          allowedColors,
                          onConfirm: (newColor) => {
                            void playAction({
                              action_type: 'change_wild',
                              change_wild: { card_id: cardId, new_color: newColor },
                            })
                          },
                        },
                      })
                    }}
                  >
                    <TinyCatalogCard cardId={cardId} size="xs" />
                    <span className="property-overview-card-badge">Swap</span>
                  </button>
                )
              }

              return <TinyCatalogCard key={`${cardId}-${index}`} cardId={cardId} size="xs" />
            })}
            {cardIds.length > 4 && <span className="property-overview-more">+{cardIds.length - 4}</span>}
          </>
        ) : (
          <span className="property-overview-empty-slot" aria-hidden="true" />
        )}
      </div>

      {(buildingIds.length > 0 || isComplete) && (
        <div className="property-overview-slot-footer">
          {buildingIds.some((id) => id.includes('house')) && <span className="property-overview-building">H</span>}
          {buildingIds.some((id) => id.includes('hotel')) && <span className="property-overview-building">T</span>}
          {isComplete && <span className="property-overview-complete-label">Full set</span>}
        </div>
      )}
    </div>
  )
}

export function PropertyOverview({
  properties,
  buildings,
  showNewSetDropZones,
}: PropertyOverviewProps) {
  return (
    <section className="property-overview" aria-label="Your property overview">
      <div className="property-overview-head">
        <span className="property-overview-kicker">Properties</span>
        <span className="property-overview-sub">Overview of your visible sets</span>
      </div>

      <div className="property-overview-columns">
        {PROPERTY_OVERVIEW_COLUMNS.map((column, columnIndex) => (
          <div key={`property-column-${columnIndex}`} className="property-overview-column">
            {column.map((color) => (
              <PropertyOverviewSlot
                key={color}
                color={color}
                cardIds={properties[color] ?? []}
                buildingIds={buildings[color] ?? []}
                showNewSetDropZone={showNewSetDropZones}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
