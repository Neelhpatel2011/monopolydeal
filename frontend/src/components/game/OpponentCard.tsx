'use client'

import { useGame } from '@/contexts/GameContext'
import { colorBgMap } from '@/lib/tailwind-parsing'
import { sumBankValue, groupColorMap, groupSetSizes } from '@/data/cardCatalog'
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
  const isTargeted = targetPlayerId === player.id
  const bankTotal = sumBankValue(player.bank)

  function handleClick() {
    dispatch({ type: 'SET_TARGET_PLAYER', playerId: isTargeted ? null : player.id })
  }

  const sets = Object.entries(player.properties)
    .filter(([, cards]) => cards.length > 0)
    .map(([color, cards]) => ({
      color,
      count: cards.length,
      setSize: groupSetSizes[color] ?? 3,
      isComplete: cards.length >= (groupSetSizes[color] ?? 3),
    }))

  const completedSets = sets.filter(s => s.isComplete).length

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
      aria-label={`${player.id} — ${isTargeted ? 'selected as target, click to deselect' : 'click to target'}`}
      aria-pressed={isTargeted}
      className={panelClass}
    >
      {/* Header row: avatar + name + turn badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div className={`opp-avatar ${bgClass}`}>
          {player.id[0]?.toUpperCase()}
        </div>
        <span className="opp-name">{player.id}</span>
        {isCurrentTurn && <span className="opp-turn-badge">TURN</span>}
      </div>

      {/* Stats: hand count, bank, completed sets */}
      <div className="opp-stats">
        <span className="opp-stat" title="Hand">
          <span className="opp-stat-ico" aria-hidden="true">🃏</span>
          <span className="opp-stat-val">{player.hand_count}</span>
        </span>
        <span className="opp-stat" title="Bank total">
          <span className="opp-stat-ico" aria-hidden="true">💰</span>
          <span className="opp-stat-val">${bankTotal}M</span>
        </span>
        {completedSets > 0 && (
          <span className="opp-sets-badge" title="Completed sets">
            ✓{completedSets}
          </span>
        )}
      </div>

      {/* Property set dots */}
      {sets.length > 0 ? (
        <div className="opp-props">
          {sets.map(({ color, count, setSize, isComplete }) => {
            const colorDef = groupColorMap[color]
            return (
              <div
                key={color}
                title={`${color}: ${count}/${setSize}`}
                className={`opp-prop-bar ${isComplete ? 'opp-prop-bar-complete' : ''}`}
              >
                {Array.from({ length: setSize }).map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'opp-prop-pip',
                      i < count ? (colorDef?.color ?? 'bg-gray-400') : 'opp-prop-pip-empty',
                    ].join(' ')}
                  />
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>No properties</span>
      )}

      {/* Target indicator */}
      {isTargeted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 13,
          border: '2px solid var(--accent)',
          pointerEvents: 'none',
        }} />
      )}
      {isTargeted && (
        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          TARGET ✓
        </span>
      )}
    </button>
  )
}

