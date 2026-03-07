'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useGame } from '@/contexts/GameContext'
import { getCard } from '@/data/cardCatalog'
import { CatalogCard } from '@/components/game/CatalogCard'

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>

function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// ─── Draggable card in hand ───────────────────────────────────────────────────

interface DraggableCardProps {
  cardId: string
  index: number
  total: number
  isSelected: boolean
  isMyTurn: boolean
  onHover: (i: number | null) => void
  isHovered: boolean
  hoveredIndex: number | null
}

function DraggableHandCard({
  cardId,
  index,
  total,
  isSelected,
  isMyTurn,
  onHover,
  isHovered,
  hoveredIndex,
}: DraggableCardProps) {
  const { dispatch } = useGame()
  const card = getCard(cardId)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `hand-card-${cardId}-${index}`,
    data: { cardId },
    disabled: !isMyTurn,
  })

  const scaleFactor = Math.max(0.38, 1 - Math.max(0, (total - 7)) * 0.11)
  const t = total === 1 ? 0 : index / (total - 1) - 0.5 // -0.5..0.5

  const maxAngle = clamp(26, 18 + total * 2, 42)
  const spread = clamp(220, total * 46, 360) * scaleFactor

  const baseRotation = t * maxAngle * scaleFactor
  const rotation = baseRotation * ((isHovered || isSelected) ? 0.15 : 1)

  let translateX = t * spread

  // Arc: center card lifts slightly, edges sit lower.
  const u = 1 - Math.min(1, Math.abs(t) * 2)
  const lift = 18 * scaleFactor
  const translateY = -Math.pow(u, 1.6) * lift

  const spreadOnHover = 44 * scaleFactor
  if (hoveredIndex !== null && hoveredIndex !== index) {
    translateX += index < hoveredIndex ? -spreadOnHover : spreadOnHover
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isMyTurn) return
    if (isSelected) {
      dispatch({ type: 'DESELECT_CARD', cardId })
    } else {
      dispatch({ type: 'SELECT_CARD', cardId })
    }
  }

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      className="hand-card-wrap absolute left-1/2 bottom-[14px]"
      style={{
        transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 360ms var(--ease-out)',
        zIndex: isDragging ? 1200 : (isHovered || isSelected ? 1100 : 100 + index),
      }}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        aria-label={`${card.name} — $${card.bankValue}M. ${isSelected ? 'Selected.' : 'Click to select.'}`}
        aria-pressed={isSelected}
        tabIndex={0}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(e as unknown as React.MouseEvent) } }}
        style={dragStyle}
        className={[
          'hand-card-hitbox',
          isDragging ? 'hand-card-dragging' : '',
          !isMyTurn ? 'cursor-not-allowed' : 'cursor-pointer',
          'focus-accent',
        ].filter(Boolean).join(' ')}
      >
        <div
          className={[
            'hand-card-surface',
            isHovered ? 'hand-card-hovered' : '',
            isSelected ? 'hand-card-selected' : '',
          ].filter(Boolean).join(' ')}
          style={
            (isHovered || isSelected
              ? ({ '--card-shadow': 'var(--card-shadow-hover)' } as CSSVarStyle)
              : undefined)
          }
        >
          <CatalogCard cardId={cardId} size="hand" />

          {/* Selected indicator */}
          {isSelected && (
            <div className="hand-selected-pin" aria-hidden="true">✓</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main PlayersHand component ───────────────────────────────────────────────

export default function PlayersHand() {
  const { state, isMyTurn, actionsLeft } = useGame()
  const { view, selectedCardIds } = state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handIds: string[] = view?.you.hand ?? []

  // Click on empty area to deselect
  function handleBackgroundClick() {
    // Deselect is handled via dispatch in DraggableHandCard
  }
  void handleBackgroundClick

  return (
    <div className="flex flex-col h-full">
      {/* Hand status bar */}
      <div className="hand-action-bar">
        {isMyTurn ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">
              Hand
            </span>
            <span className="text-[11px] text-white/55">{handIds.length} cards</span>
            <span className="w-px h-4 bg-white/10" aria-hidden="true" />
            {selectedCardIds.length > 0 ? (
              <span className="text-[11px] text-white/80 min-w-0">
                Selected:{' '}
                <span className="text-white font-semibold inline-block max-w-[160px] truncate align-bottom">
                  {getCard(selectedCardIds[0]).name}
                </span>
              </span>
            ) : (
              <>
                <span className="text-[11px] text-white/35 sm:hidden">Select a card to play</span>
                <span className="hidden sm:inline text-[11px] text-white/35">
                  Tap a card to play. Drag to bank/properties.
                </span>
              </>
            )}
            <span className="hidden sm:inline w-px h-4 bg-white/10" aria-hidden="true" />
            <span className="hidden sm:inline text-[11px] text-white/45">{actionsLeft} actions left</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
            Waiting for {view?.current_player_id ?? '...'}
          </span>
        )}
      </div>

      {/* Fan hand */}
      <div className="hand-fan-area">
        {handIds.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-sm">
            No cards in hand
          </div>
        ) : (
          handIds.map((cardId, i) => (
            <DraggableHandCard
              key={`${cardId}-${i}`}
              cardId={cardId}
              index={i}
              total={handIds.length}
              isSelected={selectedCardIds.includes(cardId)}
              isMyTurn={isMyTurn}
              onHover={setHoveredIndex}
              isHovered={hoveredIndex === i}
              hoveredIndex={hoveredIndex}
            />
          ))
        )}

        {/* Full card preview on hover */}
        {hoveredIndex !== null && hoveredIndex < handIds.length && (
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            aria-hidden="true"
          >
            <div
              className="drop-shadow-2xl"
              style={{ animation: 'zoomIn 0.3s ease-out', width: '13rem' }}
            >
              <CatalogCard cardId={handIds[hoveredIndex]} size="fill" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
