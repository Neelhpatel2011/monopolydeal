'use client'

import { useGame } from '@/contexts/GameContext'
import { colorBgMap } from '@/lib/tailwind-parsing'
import type { PlayerColor } from '@/types/player'

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'brown', 'pink', 'purple']

function getPlayerColor(playerId: string, allIds: string[]): PlayerColor {
  const idx = allIds.indexOf(playerId)
  return PLAYER_COLORS[idx % PLAYER_COLORS.length]
}

export function TurnChip() {
  const { state, isMyTurn, actionsLeft, endTurn } = useGame()
  const { view, loading } = state

  if (!view) return null

  const allPlayerIds = [view.you.id, ...view.others.map(o => o.id)]
  const currentId = view.current_player_id
  const color = currentId ? getPlayerColor(currentId, allPlayerIds) : 'blue'
  const bgClass = colorBgMap[color]

  const hasPendingPrompts = view.pending_prompts.length > 0
  const phase = hasPendingPrompts
    ? 'Response required'
    : isMyTurn
      ? actionsLeft > 0 ? `${actionsLeft}/3 actions left` : 'No actions left'
      : `${currentId ?? '?'}'s turn`

  const canEndTurn = isMyTurn && !hasPendingPrompts && !loading

  return (
    <div className="turn-chip">
      <div className={`turn-chip-avatar ${bgClass} ${isMyTurn ? 'turn-chip-avatar-myturn' : ''}`}>
        {(currentId ?? '?')[0]?.toUpperCase()}
      </div>

      <div className="turn-chip-text">
        <span className="turn-chip-name">{isMyTurn ? 'Your turn' : currentId ?? '?'}</span>
        <span className="turn-chip-phase">{phase}</span>
      </div>

      <div
        className={[
          'action-dots',
          isMyTurn ? 'action-dots-myturn' : '',
          isMyTurn && actionsLeft === 0 ? 'action-dots-none' : '',
        ].filter(Boolean).join(' ')}
        aria-label={`${actionsLeft} of 3 actions left`}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`action-dot ${i < actionsLeft ? 'action-dot-filled' : 'action-dot-empty'}`}
            aria-hidden="true"
          />
        ))}
        <span className="action-count">{actionsLeft}/3</span>
      </div>

      <div className="ml-2 flex items-center gap-2 shrink-0">
        {isMyTurn && (
          <button
            onClick={endTurn}
            disabled={!canEndTurn}
            aria-label="End your turn"
            className="btn btn-ghost text-xs px-2 py-1 h-auto"
          >
            End Turn
          </button>
        )}
      </div>
    </div>
  )
}
