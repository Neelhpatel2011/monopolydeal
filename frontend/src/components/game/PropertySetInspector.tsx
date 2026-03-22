'use client'

import { TinyCatalogCard } from '@/components/game/TinyCatalogCard'
import {
  getSetRentSummary,
  groupColorMap,
  groupDisplayNames,
} from '@/data/cardCatalog'

interface PropertySetInspectorProps {
  color: string
  cardIds: string[]
  buildingIds?: string[]
  chargeMultiplier?: number
  title?: string
}

export function PropertySetInspector({
  color,
  cardIds,
  buildingIds = [],
  chargeMultiplier = 1,
  title,
}: PropertySetInspectorProps) {
  const doubleRentCount =
    chargeMultiplier > 1 ? Math.round(Math.log2(chargeMultiplier)) : 0
  const summary = getSetRentSummary(color, cardIds, buildingIds, doubleRentCount)
  const colorDef = groupColorMap[color]
  const displayName = groupDisplayNames[color] ?? color
  const activeStepIndex =
    summary.rentTable.length > 0
      ? Math.min(summary.propertyCount, summary.rentTable.length) - 1
      : -1

  return (
    <div className="prop-inspector-panel" role="presentation">
      <div className="prop-inspector-head">
        <div className="prop-inspector-title-wrap">
          <span className={`prop-inspector-color ${colorDef?.color ?? 'bg-slate-500'}`} />
          <div className="prop-inspector-title-block">
            <span className="prop-inspector-title">{title ?? displayName}</span>
            <span className="prop-inspector-subtitle">
              {summary.propertyCount}/{summary.setSize} cards
              {summary.isFullSet ? ' / Full set' : ''}
            </span>
          </div>
        </div>
        <div className="prop-inspector-rent-block">
          <span className="prop-inspector-rent-label">
            {chargeMultiplier > 1 ? 'Charge' : 'Rent'}
          </span>
          <span className="prop-inspector-rent-value">
            ${chargeMultiplier > 1 ? summary.totalRent : summary.setRent}M
          </span>
        </div>
      </div>

      <div className="prop-inspector-cards">
        {cardIds.map((id, index) => (
          <TinyCatalogCard
            key={`${id}-${index}`}
            cardId={id}
            size="sm"
            className="prop-inspector-card"
          />
        ))}
        {buildingIds.map((id, index) => {
          const isHotel = id.includes('hotel')
          return (
            <span
              key={`${id}-${index}`}
              className={[
                'prop-inspector-building',
                isHotel
                  ? 'prop-inspector-building-hotel'
                  : 'prop-inspector-building-house',
              ].join(' ')}
              title={isHotel ? 'Hotel' : 'House'}
            >
              {isHotel ? 'Hotel +4' : 'House +3'}
            </span>
          )
        })}
      </div>

      {summary.rentTable.length > 0 && (
        <div className="prop-inspector-table">
          {summary.rentTable.map((rent, index) => (
            <div
              key={`${color}-${index}`}
              className={[
                'prop-inspector-step',
                index === activeStepIndex ? 'prop-inspector-step-active' : '',
              ].join(' ')}
            >
              <span className="prop-inspector-step-count">
                {index + 1} {index === 0 ? 'card' : 'cards'}
              </span>
              <span className="prop-inspector-step-value">${rent}M</span>
            </div>
          ))}
        </div>
      )}

      {(summary.buildingBonus > 0 || chargeMultiplier > 1) && (
        <div className="prop-inspector-note">
          <span>Base ${summary.baseRent}M</span>
          {summary.buildingBonus > 0 && <span>+ Buildings ${summary.buildingBonus}M</span>}
          {chargeMultiplier > 1 && <span>x{chargeMultiplier} multiplier</span>}
        </div>
      )}
    </div>
  )
}
