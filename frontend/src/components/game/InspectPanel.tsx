'use client'

import { colorBgMap } from '@/lib/tailwind-parsing'
import type { PlayerPublicView } from '@/types/api'
import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'
import { getBankTotal, getPublicSetSummaries, getSeatColor } from '@/components/game/boardUtils'

interface InspectPanelProps {
  player: PlayerPublicView | null
  allPlayerIds: string[]
  hostId?: string | null
}

export function InspectPanel({ player, allPlayerIds, hostId }: InspectPanelProps) {
  if (!player) {
    return (
      <aside className="inspect-panel">
        <div className="inspect-panel-empty">
          <span className="inspect-panel-kicker">Inspect</span>
          <span className="inspect-panel-title">No Opponent</span>
          <span className="inspect-panel-sub">An inspected public board will appear here.</span>
        </div>
      </aside>
    )
  }

  const avatarColor = colorBgMap[getSeatColor(player.id, allPlayerIds)]
  const bankTotal = getBankTotal(player)
  const setSummaries = getPublicSetSummaries(player)
  const isHost = hostId === player.id

  return (
    <aside className="inspect-panel" aria-label={`${player.id} public board`}>
      <div className="inspect-panel-head">
        <div className={`inspect-panel-avatar ${avatarColor}`} aria-hidden="true">
          {player.id[0]?.toUpperCase()}
        </div>

        <div className="inspect-panel-copy">
          <span className="inspect-panel-kicker">Public Board</span>
          <div className="inspect-panel-title-row">
            <span className="inspect-panel-title">{player.id}</span>
            {isHost && <span className="inspect-panel-pill">Host</span>}
          </div>
          <span className="inspect-panel-bank">${bankTotal}M banked</span>
        </div>
      </div>

      <div className="inspect-panel-section">
        <div className="inspect-panel-section-head">
          <span className="inspect-panel-section-title">Properties</span>
          <span className="inspect-panel-section-meta">{setSummaries.length} groups</span>
        </div>

        {setSummaries.length > 0 ? (
          <div className="inspect-panel-groups">
            {setSummaries.map(set => {
              const propertyCards = player.properties[set.color] ?? []
              const buildingCards = player.buildings[set.color] ?? []

              return (
                <section key={set.color} className="inspect-panel-group">
                  <div className="inspect-panel-group-head">
                    <div className="inspect-panel-group-title">
                      <span className={`inspect-panel-group-chip ${set.swatch}`} />
                      <span>{set.label}</span>
                    </div>
                    <span className="inspect-panel-group-count">{set.count}/{set.setSize}</span>
                  </div>

                  <div className="inspect-panel-card-row">
                    {propertyCards.map((cardId, index) => (
                      <TinyCatalogCard key={`${cardId}-${index}`} cardId={cardId} size="sm" />
                    ))}
                    {buildingCards.map((cardId, index) => (
                      <TinyCatalogCard key={`${cardId}-${index}`} cardId={cardId} size="sm" />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="inspect-panel-empty-state">No visible property sets</div>
        )}
      </div>

      <div className="inspect-panel-section inspect-panel-bank-preview">
        <div className="inspect-panel-section-head">
          <span className="inspect-panel-section-title">Bank</span>
          <span className="inspect-panel-section-meta">{player.bank.length} cards</span>
        </div>

        {player.bank.length > 0 ? (
          <div className="inspect-panel-card-row">
            {player.bank.slice(0, 6).map((cardId, index) => (
              <TinyCatalogCard key={`${cardId}-${index}`} cardId={cardId} size="sm" />
            ))}
            {player.bank.length > 6 && (
              <span className="inspect-panel-more">+{player.bank.length - 6}</span>
            )}
          </div>
        ) : (
          <div className="inspect-panel-empty-state">No banked cards</div>
        )}
      </div>
    </aside>
  )
}
