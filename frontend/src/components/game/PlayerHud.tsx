'use client'

import { colorBgMap } from '@/lib/tailwind-parsing'
import type { PlayerPublicView } from '@/types/api'
import { getBankTotal, getPublicSetSummaries, getSeatColor } from '@/components/game/boardUtils'

interface PlayerHudProps {
  player: PlayerPublicView
  allPlayerIds: string[]
  isActive: boolean
  isTargeted: boolean
  isInspected: boolean
  isHost: boolean
  onInspect: (playerId: string) => void
  onToggleTarget: (playerId: string) => void
}

export function PlayerHud({
  player,
  allPlayerIds,
  isActive,
  isTargeted,
  isInspected,
  isHost,
  onInspect,
  onToggleTarget,
}: PlayerHudProps) {
  const avatarColor = colorBgMap[getSeatColor(player.id, allPlayerIds)]
  const bankTotal = getBankTotal(player)
  const setSummaries = getPublicSetSummaries(player).slice(0, 3)
  const panelClass = [
    'player-hud',
    isActive ? 'player-hud-active' : '',
    isTargeted ? 'player-hud-targeted' : '',
    isInspected ? 'player-hud-inspected' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={panelClass}
      aria-pressed={isTargeted}
      aria-label={`${player.id}. ${isTargeted ? 'Target selected.' : 'Click to target.'}`}
      onMouseEnter={() => onInspect(player.id)}
      onFocus={() => onInspect(player.id)}
      onClick={() => onToggleTarget(player.id)}
    >
      <span className={`player-hud-avatar ${avatarColor}`} aria-hidden="true">
        {player.id[0]?.toUpperCase()}
      </span>

      <div className="player-hud-copy">
        <div className="player-hud-topline">
          <span className="player-hud-name">{player.id}</span>
          {isHost && <span className="player-hud-pill">Host</span>}
          {isActive && <span className="player-hud-pill">Turn</span>}
        </div>

        <div className="player-hud-bank">${bankTotal}M</div>

        <div className="player-hud-progress">
          {setSummaries.length > 0 ? (
            setSummaries.map(set => (
              <div key={set.color} className="player-hud-progress-row">
                <div className="player-hud-progress-copy">
                  <span className="player-hud-progress-label">{set.label}</span>
                  <span className="player-hud-progress-value">{set.count}/{set.setSize}</span>
                </div>
                <div className="player-hud-progress-track">
                  <div
                    className={`player-hud-progress-fill ${set.swatch}`}
                    style={{ width: `${Math.min(100, (set.count / set.setSize) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <span className="player-hud-empty">No properties</span>
          )}
        </div>
      </div>
    </button>
  )
}
