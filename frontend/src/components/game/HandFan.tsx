'use client'

import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useGame } from '@/contexts/GameContext'
import { getCard } from '@/data/cardCatalog'
import { CatalogCard } from '@/components/game/CatalogCard'

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>

function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCardTypeLabel(cardId: string) {
  const card = getCard(cardId)
  if (card.kind === 'property_wild') return 'Wild Property'
  if (card.kind === 'property') return 'Property'
  if (card.kind === 'money') return 'Money'
  if (card.kind === 'rent') return 'Rent'
  return 'Action'
}

interface DraggableCardProps {
  cardId: string
  index: number
  total: number
  isSelected: boolean
  isMyTurn: boolean
  onHover: (index: number | null) => void
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

  const scaleFactor = Math.max(0.76, 1 - Math.max(0, total - 7) * 0.05)
  const t = total === 1 ? 0 : index / (total - 1) - 0.5
  const maxAngle = clamp(13, 12 + total * 1.15, 20)
  const spread = clamp(300, total * 58, 520) * scaleFactor
  const baseRotation = t * maxAngle
  const rotation = baseRotation * ((isHovered || isSelected) ? 0.38 : 1)

  let translateX = t * spread
  const arcHeight = 44 * scaleFactor
  const translateY = -(1 - Math.pow(Math.abs(t) * 2, 1.7)) * arcHeight
  const neighborSpread = 24 * scaleFactor

  if (hoveredIndex !== null && hoveredIndex !== index) {
    translateX += index < hoveredIndex ? -neighborSpread : neighborSpread
  }

  function handleClick(event: ReactMouseEvent) {
    event.stopPropagation()
    if (!isMyTurn) return
    if (isSelected) {
      dispatch({ type: 'DESELECT_CARD', cardId })
      return
    }
    dispatch({ type: 'SELECT_CARD', cardId })
  }

  const dragStyle = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      className="hand-card-wrap"
      style={{
        transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 260ms var(--ease-out)',
        zIndex: isDragging ? 1300 : isSelected ? 1200 : isHovered ? 1100 : 100 + index,
      }}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        aria-label={`${card.name} - $${card.bankValue}M. ${isSelected ? 'Selected.' : 'Click to select.'}`}
        aria-pressed={isSelected}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            handleClick(event as unknown as ReactMouseEvent)
          }
        }}
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
          {isSelected && <div className="hand-selected-pin" aria-hidden="true">Sel</div>}
        </div>
      </div>
    </div>
  )
}

function HostBadge({ title = 'Host' }: { title?: string }) {
  return (
    <span className="host-badge host-badge-compact" title={title}>
      <span className="host-crown" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 18h18l-1.6 3H4.6L3 18Zm2.1-10.2 3.7 3.3 3.2-5.1 3.2 5.1 3.7-3.3 1.9 8.1H3.2l1.9-8.1Z" fill="currentColor" />
        </svg>
      </span>
      Host
    </span>
  )
}

export function HandFan() {
  const { state, isMyTurn, actionsLeft } = useGame()
  const { view, selectedCardIds } = state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handIds: string[] = view?.you.hand ?? []
  const isHost = view?.host_id === view?.you.id
  const previewCardId =
    hoveredIndex !== null && hoveredIndex < handIds.length
      ? handIds[hoveredIndex]
      : selectedCardIds[0] ?? null
  const previewCard = previewCardId ? getCard(previewCardId) : null
  const previewMode =
    hoveredIndex !== null && hoveredIndex < handIds.length
      ? 'Hovered card'
      : selectedCardIds.length > 0
        ? 'Selected card'
        : 'Hand'
  const focusTitle = previewCard
    ? `${previewCard.name} / ${getCardTypeLabel(previewCardId!)} / $${previewCard.bankValue}M`
    : `${handIds.length} cards ready`

  return (
    <div className="hand-layout">
      <div className="hand-action-bar">
        {isMyTurn ? (
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">
              Hand
            </span>
            {isHost && <HostBadge />}
            <span className="text-[11px] text-white/55">{handIds.length} cards</span>
            <span className="w-px h-4 bg-white/10" aria-hidden="true" />
            <span className="hand-focus-pill">
              <span className="hand-focus-kicker">{previewMode}</span>
              <span className="hand-focus-title">
                {selectedCardIds.length > 1 ? `${selectedCardIds.length} cards selected` : focusTitle}
              </span>
            </span>
            <span className="hidden sm:inline w-px h-4 bg-white/10" aria-hidden="true" />
            <span className="hidden sm:inline text-[11px] text-white/45">{actionsLeft} actions left</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            {isHost && <HostBadge title="You are the host" />}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
              Waiting for {view?.current_player_id ?? '...'}
            </span>
            <span className="hand-focus-pill hand-focus-pill-muted">
              <span className="hand-focus-kicker">Hand</span>
              <span className="hand-focus-title">{handIds.length} cards ready</span>
            </span>
          </div>
        )}
      </div>

      <div className="hand-stage">
        <div className="hand-fan-shell">
          <div className="hand-fan-area">
            {handIds.length === 0 ? (
              <div className="hand-empty-state">No cards in hand</div>
            ) : (
              handIds.map((cardId, index) => (
                <DraggableHandCard
                  key={`${cardId}-${index}`}
                  cardId={cardId}
                  index={index}
                  total={handIds.length}
                  isSelected={selectedCardIds.includes(cardId)}
                  isMyTurn={isMyTurn}
                  onHover={setHoveredIndex}
                  isHovered={hoveredIndex === index}
                  hoveredIndex={hoveredIndex}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
