'use client'

import { useGame } from '@/contexts/GameContext'
import { colorBgMap } from '@/lib/tailwind-parsing'
import { sumBankValue, groupSetSizes, groupDisplayNames, groupColorMap } from '@/data/cardCatalog'
import type { PlayerPublicView } from '@/types/api'
import type { PlayerColor } from '@/types/player'

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'brown', 'pink', 'purple']

interface OpponentCardProps {
  player: PlayerPublicView
  allPlayerIds: string[]
  index: number
  onHoverChange?: (playerId: string | null) => void
}

export function OpponentCard({ player, index, onHoverChange }: OpponentCardProps) {
  const { state, dispatch } = useGame()
  const { view, targetPlayerId } = state

  const color = PLAYER_COLORS[(index + 1) % PLAYER_COLORS.length]
  const bgClass = colorBgMap[color]
  const isCurrentTurn = view?.current_player_id === player.id
  const isHost = view?.host_id === player.id
  const isTargeted = targetPlayerId === player.id
  const bankTotal = sumBankValue(player.bank)

  function handleClick() {
    dispatch({ type: 'SET_TARGET_PLAYER', playerId: isTargeted ? null : player.id })
  }

  const sets = Object.entries(player.properties)
    .filter(([, cards]) => cards.length > 0)
    .map(([colorKey, cards]) => ({
      color: colorKey,
      label: groupDisplayNames[colorKey] ?? colorKey,
      count: cards.length,
      setSize: groupSetSizes[colorKey] ?? 3,
      isComplete: cards.length >= (groupSetSizes[colorKey] ?? 3),
      swatch: groupColorMap[colorKey]?.color ?? 'bg-gray-400',
    }))
    .sort((left, right) => {
      if (left.isComplete !== right.isComplete) return left.isComplete ? -1 : 1
      if (left.count !== right.count) return right.count - left.count
      return left.label.localeCompare(right.label)
    })

  const visibleSets = sets.slice(0, 3)
  const hiddenSetCount = Math.max(0, sets.length - visibleSets.length)

  const panelClass = [
    'opp-panel',
    isCurrentTurn ? 'opp-panel-active-turn' : '',
    isTargeted ? 'opp-panel-targeted' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => onHoverChange?.(player.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      aria-label={`${player.id} - ${isTargeted ? 'selected as target, click to deselect' : 'click to target'}`}
      aria-pressed={isTargeted}
      className={panelClass}
    >
      <div className="opp-panel-head">
        <div className={`opp-avatar ${bgClass}`}>
          {player.id[0]?.toUpperCase()}
        </div>

        <div className="opp-panel-copy">
          <div className="opp-panel-name-row">
            <span className="opp-name">{player.id}</span>
            {isHost && (
              <span className="host-badge host-badge-compact" title="Host">
                <span className="host-crown" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 18h18l-1.6 3H4.6L3 18Zm2.1-10.2 3.7 3.3 3.2-5.1 3.2 5.1 3.7-3.3 1.9 8.1H3.2l1.9-8.1Z" fill="currentColor" />
                  </svg>
                </span>
                Host
              </span>
            )}
          </div>
          <div className="opp-panel-bank">${bankTotal}M</div>
        </div>

        {isCurrentTurn && <span className="opp-turn-badge">Turn</span>}
      </div>

      <div className="opp-panel-meta">
        <span className="opp-meta-pill">{player.hand_count} in hand</span>
        <span className="opp-meta-pill">{sets.length} set{sets.length === 1 ? '' : 's'}</span>
      </div>

      {visibleSets.length > 0 ? (
        <div className="opp-progress-list">
          {visibleSets.map(set => (
            <div key={set.color} className="opp-progress-row">
              <div className="opp-progress-copy">
                <span className="opp-progress-label">{set.label}</span>
                <span className="opp-progress-value">{set.count}/{set.setSize}</span>
              </div>
              <div className="opp-progress-track">
                <div
                  className={`opp-progress-fill ${set.swatch}`}
                  style={{ width: `${Math.min(100, (set.count / set.setSize) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {hiddenSetCount > 0 && (
            <span className="opp-progress-more">+{hiddenSetCount} more</span>
          )}
        </div>
      ) : (
        <span className="opp-progress-empty">No properties</span>
      )}
    </button>
  )
}
