'use client'

import { useDroppable } from '@dnd-kit/core'
import { useGame } from '@/contexts/GameContext'
import { getCard, groupColorMap, groupSetSizes, groupDisplayNames } from '@/data/cardCatalog'
import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'

interface PropertySetProps {
  color: string
  cardIds: string[]
  buildingIds?: string[]
  /** If true, show as the current player's own set (with drop zone) */
  isOwn?: boolean
}

export function PropertySet({ color, cardIds, buildingIds = [], isOwn = false }: PropertySetProps) {
  const { state, dispatch, playAction, isMyTurn, actionsLeft } = useGame()
  const { setNodeRef, isOver } = useDroppable({
    id: `prop-set-${color}`,
    disabled: !isOwn,
  })

  const colorDef = groupColorMap[color]
  const setSize = groupSetSizes[color] ?? 3
  const count = cardIds.length
  const isComplete = count >= setSize
  const panelClass = [
    'prop-set-card',
    isComplete ? `set-${color} prop-set-card-complete` : '',
    isOwn && isOver ? 'prop-set-card-over' : '',
    isOwn ? 'cursor-default' : '',
  ].filter(Boolean).join(' ')

  const rentTable = (() => {
    const sample = cardIds.find(id => getCard(id).rentByCount)
    return getCard(sample ?? '').rentByCount ?? []
  })()

  const currentRent = rentTable[Math.min(count, rentTable.length) - 1] ?? 0

  const hasHouse = buildingIds.some(id => id.includes('house'))
  const hasHotel = buildingIds.some(id => id.includes('hotel'))

  const layerCount = Math.min(Math.max(setSize, count), 5)
  const placeholderCount = Math.min(setSize, 5)
  const xStep = 12
  const yStep = 3
  const cardW = 56 // must match TinyCatalogCard size="md"
  const cardH = Math.round(cardW * 7 / 5)
  const stackW = cardW + (layerCount - 1) * xStep
  const stackH = cardH + (layerCount - 1) * yStep
  const canChangeWild = isOwn && isMyTurn && actionsLeft > 0 && !state.loading

  return (
    <div
      ref={isOwn ? setNodeRef : undefined}
      className={panelClass}
    >
      {/* Header */}
      <div className={`prop-set-header ${colorDef?.color ?? 'bg-gray-600'}`}>
        <span className={`prop-set-title ${colorDef?.text ?? 'text-white'}`}>
          {groupDisplayNames[color] ?? color}
        </span>
        {isComplete && (
          <span className="prop-set-full-badge">FULL</span>
        )}
      </div>

      {/* Cards stacked */}
      <div className="prop-set-body">
        <div className="relative mx-auto" style={{ width: stackW, height: stackH }}>
          {/* Empty slots as faint silhouettes (communicates set size) */}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`slot-${i}`}
              className="absolute"
              style={{
                left: i * xStep,
                top: i * yStep,
                transform: `rotate(${(i - (layerCount - 1) / 2) * 2}deg)`,
                opacity: 0.35,
              }}
              aria-hidden="true"
            >
              <div className="prop-card-silhouette" />
            </div>
          ))}

          {/* Actual cards */}
          {cardIds.slice(0, layerCount).map((id, i) => (
            (() => {
              const c = getCard(id)
              const isWild = c.kind === 'property_wild'
              const allowedColors = c.wildColors ?? []
              const clickable = canChangeWild && isWild && allowedColors.length > 0

              return (
                <div
                  key={`${id}-${i}`}
                  className="absolute"
                  style={{
                    left: i * xStep,
                    top: i * yStep,
                    transform: `rotate(${(i - (layerCount - 1) / 2) * 2}deg)`,
                    zIndex: 10 + i,
                  }}
                  title={clickable ? 'Click to change wild color' : c.name}
                >
                  {clickable ? (
                    <button
                      type="button"
                      className="prop-wild-btn"
                      aria-label={`Change wild color: ${c.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({
                          type: 'SET_CHOICE_MODAL',
                          modal: {
                            mode: 'choose_color',
                            allowedColors,
                            onConfirm: (newColor) => {
                              void playAction({
                                action_type: 'change_wild',
                                change_wild: { card_id: id, new_color: newColor },
                              })
                            },
                          },
                        })
                      }}
                    >
                      <TinyCatalogCard cardId={id} size="md" />
                      <span className="prop-wild-badge" aria-hidden="true">↺</span>
                    </button>
                  ) : (
                    <TinyCatalogCard cardId={id} size="md" />
                  )}
                </div>
              )
            })()
          ))}

          {/* Buildings (tokens sit on top of the top-most card) */}
          {(hasHouse || hasHotel) && (
            <div className="prop-buildings-overlay" aria-hidden="true">
              {hasHotel && (
                <span title="Hotel" className="prop-building-token prop-building-token-hotel">
                  <svg className="prop-building-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 21H3V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16h-4v-3H7v3Zm2-13H7v2h2V8Zm0 4H7v2h2v-2Zm4-4h-2v2h2V8Zm0 4h-2v2h2v-2Zm8 9h-4V9h2a2 2 0 0 1 2 2v10Z" fill="currentColor" />
                  </svg>
                </span>
              )}
              {hasHouse && (
                <span title="House" className="prop-building-token prop-building-token-house">
                  <svg className="prop-building-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 3 10v11h6v-6h6v6h6V10L12 3Z" fill="currentColor" />
                  </svg>
                </span>
              )}
            </div>
          )}

          {/* Overflow indicator */}
          {cardIds.length > layerCount && (
            <div
              className="absolute"
              style={{
                left: (layerCount - 1) * xStep,
                top: (layerCount - 1) * yStep,
                zIndex: 99,
              }}
            >
              <div className="prop-card-overflow">
                <span className="text-[10px] font-black text-white/85">+{cardIds.length - layerCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buildings */}
        {false && isComplete && (hasHouse || hasHotel) && (
          <div className="flex gap-0.5 mt-0.5">
            {hasHouse && <span title="House" className="text-[10px]">🏠</span>}
            {hasHotel && <span title="Hotel" className="text-[10px]">🏨</span>}
          </div>
        )}
      </div>

      {/* Rent footer */}
      <div className="prop-set-footer">
        <span>Rent: </span>
        <span className="prop-set-rent-value">${currentRent}M</span>
        {(hasHouse || hasHotel) && (
          <span className="text-[9px] text-white/30"> +bonus</span>
        )}
      </div>
    </div>
  )
}

// Drop zone for a new color group (when player has no cards there yet)
interface NewSetDropZoneProps {
  color: string
}

export function NewSetDropZone({ color }: NewSetDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `new-set-${color}` })
  const colorDef = groupColorMap[color]

  return (
    <div
      ref={setNodeRef}
      className={[
        'new-set-slot',
        isOver ? 'new-set-slot-over' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={['new-set-chip', colorDef?.color ?? 'bg-gray-600'].join(' ')} />
      <span className="new-set-label">{groupDisplayNames[color]}</span>
    </div>
  )
}

