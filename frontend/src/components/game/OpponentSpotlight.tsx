'use client'

import { useRef, useState } from 'react'
import type { PlayerPublicView } from '@/types/api'
import {
  getCard,
  getSetRentSummary,
  groupColorMap,
  groupDisplayNames,
  sumBankValue,
} from '@/data/cardCatalog'
import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'
import { PropertySetInspector } from '@/components/game/PropertySetInspector'

function SpotlightPropertyGroup({
  color,
  ids,
  buildingIds,
}: {
  color: string
  ids: string[]
  buildingIds: string[]
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [inspectorPos, setInspectorPos] = useState<{ left: number; top: number } | null>(null)

  const def = groupColorMap[color]
  const title = groupDisplayNames[color] ?? color
  const fullSetSize = getCard(ids[0] ?? '').setSize ?? 3
  const isComplete = ids.length >= fullSetSize
  const hasHouse = buildingIds.some((b) => b.includes('house'))
  const hasHotel = buildingIds.some((b) => b.includes('hotel'))
  const rentSummary = getSetRentSummary(color, ids, buildingIds)

  function showInspector() {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setInspectorPos({ left: rect.left + rect.width / 2, top: rect.top - 14 })
    setIsInspecting(true)
  }

  return (
    <div
      ref={anchorRef}
      className={`opp-spotlight-prop-group ${isComplete ? 'opp-spotlight-prop-complete' : ''}`}
      onMouseEnter={showInspector}
      onMouseLeave={() => setIsInspecting(false)}
    >
      <div className="opp-spotlight-prop-head">
        <span className={`opp-spotlight-color-chip ${def?.color ?? 'bg-slate-500'}`} />
        <span className="opp-spotlight-prop-title">{title}</span>
        <span className="opp-spotlight-prop-rent">${rentSummary.setRent}M</span>
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

      {isInspecting && inspectorPos && (
        <div
          className="prop-inspector-popover"
          style={{ left: inspectorPos.left, top: inspectorPos.top }}
          aria-hidden="true"
        >
          <PropertySetInspector
            color={color}
            cardIds={ids}
            buildingIds={buildingIds}
            title={`${title} Set`}
          />
        </div>
      )}
    </div>
  )
}

export function OpponentSpotlight({
  player,
  hostId,
}: {
  player: PlayerPublicView
  hostId?: string | null
}) {
  const bankTotal = sumBankValue(player.bank)
  const isHost = hostId === player.id

  const propGroups = Object.entries(player.properties)
    .filter(([, ids]) => ids.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="opp-spotlight-panel" aria-label={`${player.id} board`}>
      <div className="opp-spotlight-head">
        <div className="opp-spotlight-name">
          <span className="opp-spotlight-avatar">{player.id[0]?.toUpperCase()}</span>
          <div className="min-w-0">
            <div className="opp-spotlight-title-row">
              <div className="opp-spotlight-title">{player.id}</div>
              {isHost && (
                <span className="host-badge" title="Host">
                  <span className="host-crown" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 18h18l-1.6 3H4.6L3 18Zm2.1-10.2 3.7 3.3 3.2-5.1 3.2 5.1 3.7-3.3 1.9 8.1H3.2l1.9-8.1Z" fill="currentColor" />
                    </svg>
                  </span>
                  Host
                </span>
              )}
            </div>
            <div className="opp-spotlight-sub">
              <span>Hand: {player.hand_count}</span>
              <span className="opp-spotlight-dot" />
              <span>Bank: ${bankTotal}M</span>
            </div>
          </div>
        </div>
      </div>

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

      <div className="opp-spotlight-section">
        <div className="opp-spotlight-section-title">Properties</div>
        {propGroups.length === 0 ? (
          <div className="opp-spotlight-empty">No properties yet</div>
        ) : (
          <div className="opp-spotlight-props">
            {propGroups.map(([color, ids]) => (
              <SpotlightPropertyGroup
                key={color}
                color={color}
                ids={ids}
                buildingIds={player.buildings[color] ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
