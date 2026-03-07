'use client'

import type { PlayerPublicView } from '@/types/api'
import { getCard, groupColorMap, groupDisplayNames, sumBankValue } from '@/data/cardCatalog'
import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'

export function OpponentSpotlight({ player }: { player: PlayerPublicView }) {
  const bankTotal = sumBankValue(player.bank)

  const propGroups = Object.entries(player.properties)
    .filter(([, ids]) => ids.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="opp-spotlight-panel" aria-label={`${player.id} board`}>
      <div className="opp-spotlight-head">
        <div className="opp-spotlight-name">
          <span className="opp-spotlight-avatar">{player.id[0]?.toUpperCase()}</span>
          <div className="min-w-0">
            <div className="opp-spotlight-title">{player.id}</div>
            <div className="opp-spotlight-sub">
              <span>Hand: {player.hand_count}</span>
              <span className="opp-spotlight-dot" />
              <span>Bank: ${bankTotal}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="opp-spotlight-section">
        <div className="opp-spotlight-section-title">Bank</div>
        {player.bank.length === 0 ? (
          <div className="opp-spotlight-empty">No bank cards</div>
        ) : (
          <div className="opp-spotlight-card-row">
            {player.bank.slice(0, 12).map((id, i) => (
              <TinyCatalogCard key={`${id}-${i}`} cardId={id} size="xs" />
            ))}
            {player.bank.length > 12 && (
              <div className="opp-spotlight-more">+{player.bank.length - 12}</div>
            )}
          </div>
        )}
      </div>

      {/* Properties */}
      <div className="opp-spotlight-section">
        <div className="opp-spotlight-section-title">Properties</div>
        {propGroups.length === 0 ? (
          <div className="opp-spotlight-empty">No properties yet</div>
        ) : (
          <div className="opp-spotlight-props">
            {propGroups.map(([color, ids]) => {
              const def = groupColorMap[color]
              const title = groupDisplayNames[color] ?? color
              const fullSetSize = getCard(ids[0] ?? '').setSize ?? 3
              const isComplete = ids.length >= fullSetSize
              const buildings = player.buildings[color] ?? []
              const hasHouse = buildings.some(b => b.includes('house'))
              const hasHotel = buildings.some(b => b.includes('hotel'))
              return (
                <div key={color} className={`opp-spotlight-prop-group ${isComplete ? 'opp-spotlight-prop-complete' : ''}`}>
                  <div className="opp-spotlight-prop-head">
                    <span className={`opp-spotlight-color-chip ${def?.color ?? 'bg-slate-500'}`} />
                    <span className="opp-spotlight-prop-title">{title}</span>
                    <span className="opp-spotlight-prop-count">{ids.length}/{fullSetSize}</span>
                    {(hasHouse || hasHotel) && (
                      <span className="opp-spotlight-building-tokens" title="Buildings">
                        {hasHouse && (
                          <span className="opp-building-token opp-building-token-house" title="House" aria-label="House">
                            <svg className="opp-building-icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 3 3 10v11h6v-6h6v6h6V10L12 3Z" fill="currentColor" />
                            </svg>
                          </span>
                        )}
                        {hasHotel && (
                          <span className="opp-building-token opp-building-token-hotel" title="Hotel" aria-label="Hotel">
                            <svg className="opp-building-icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M7 21H3V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16h-4v-3H7v3Zm2-13H7v2h2V8Zm0 4H7v2h2v-2Zm4-4h-2v2h2V8Zm0 4h-2v2h2v-2Zm8 9h-4V9h2a2 2 0 0 1 2 2v10Z" fill="currentColor" />
                            </svg>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="opp-spotlight-card-row">
                    {ids.map((id) => (
                      <TinyCatalogCard key={id} cardId={id} size="xs" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
