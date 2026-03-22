'use client'

import type { CSSProperties, ReactNode } from 'react'
import { getCard, groupColorMap, groupDisplayNames } from '@/data/cardCatalog'

export type CatalogCardSize = 'xs' | 'sm' | 'md' | 'prop' | 'hand' | 'fill'

const SIZE_CLASS: Record<CatalogCardSize, string> = {
  xs: 'w-[34px]',
  sm: 'w-[44px]',
  md: 'w-[60px]',
  prop: 'w-[76px]',
  hand: 'w-[92px] sm:w-[104px] md:w-[114px]',
  fill: 'w-full',
}

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>

const SIZE_TOKENS: Record<
  CatalogCardSize,
  {
    pad: string
    gap: string
    radius: string
    band: string
    kicker: string
    title: string
    meta: string
    desc: string
    badge: string
    seal: string
    chip: string
    iconStroke: string
  }
> = {
  xs: {
    pad: '6px',
    gap: '4px',
    radius: '11px',
    band: '5px',
    kicker: '0.34rem',
    title: '0.42rem',
    meta: '0.35rem',
    desc: '0.34rem',
    badge: '0.35rem',
    seal: '18px',
    chip: '7px',
    iconStroke: '1.4',
  },
  sm: {
    pad: '7px',
    gap: '5px',
    radius: '12px',
    band: '6px',
    kicker: '0.39rem',
    title: '0.48rem',
    meta: '0.39rem',
    desc: '0.38rem',
    badge: '0.38rem',
    seal: '22px',
    chip: '8px',
    iconStroke: '1.5',
  },
  md: {
    pad: '9px',
    gap: '6px',
    radius: '14px',
    band: '7px',
    kicker: '0.44rem',
    title: '0.58rem',
    meta: '0.44rem',
    desc: '0.43rem',
    badge: '0.42rem',
    seal: '28px',
    chip: '9px',
    iconStroke: '1.6',
  },
  prop: {
    pad: '11px',
    gap: '7px',
    radius: '15px',
    band: '8px',
    kicker: '0.48rem',
    title: '0.68rem',
    meta: '0.5rem',
    desc: '0.46rem',
    badge: '0.48rem',
    seal: '34px',
    chip: '10px',
    iconStroke: '1.7',
  },
  hand: {
    pad: '12px',
    gap: '8px',
    radius: '16px',
    band: '9px',
    kicker: '0.52rem',
    title: '0.74rem',
    meta: '0.54rem',
    desc: '0.5rem',
    badge: '0.52rem',
    seal: '38px',
    chip: '11px',
    iconStroke: '1.8',
  },
  fill: {
    pad: '18px',
    gap: '12px',
    radius: '20px',
    band: '12px',
    kicker: '0.62rem',
    title: '1rem',
    meta: '0.68rem',
    desc: '0.68rem',
    badge: '0.62rem',
    seal: '76px',
    chip: '13px',
    iconStroke: '1.9',
  },
}

function cap(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value
}

function iconForKind(kind: string): ReactNode {
  if (kind === 'money') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 7.5h17v9h-17z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" />
        <path d="M7 10c.5-.7 1.3-1 2.1-1M17 14c-.5.7-1.3 1-2.1 1" fill="none" stroke="currentColor" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'property' || kind === 'property_wild') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 11.5 12 5l7.5 6.5v8h-5v-4.75h-5V19.5h-5z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'rent') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8.5h14M5 12h10M5 15.5h8" fill="none" stroke="currentColor" strokeLinecap="round" />
        <path d="M16.5 5.5c1.7 1 2.75 2.9 2.75 5.1 0 3.2-2.3 5.7-5.25 5.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3-5 8h3l-1 10 8-11h-4l2-7z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function bandLabel(cardId: string, kind: string, propertyGroup?: string) {
  if (kind === 'property') return groupDisplayNames[propertyGroup ?? ''] ?? 'Property'
  if (kind === 'property_wild') return 'Wild Property'
  if (kind === 'money') return 'Bank Note'
  if (kind === 'rent') return 'Rent'
  if (cardId === 'action_just_say_no') return 'Counter'
  return 'Action'
}

function kindMeta(kind: string) {
  if (kind === 'property_wild') return 'Flexible placement'
  if (kind === 'property') return 'Plays to your tableau'
  if (kind === 'money') return 'Play to your bank'
  if (kind === 'rent') return 'Charge for your sets'
  return 'Single-use effect'
}

function chipLimit(size: CatalogCardSize) {
  if (size === 'fill') return 10
  if (size === 'hand') return 6
  if (size === 'prop') return 5
  return 4
}

export function CatalogCard({
  cardId,
  size = 'sm',
  className = '',
}: {
  cardId: string
  size?: CatalogCardSize
  className?: string
}) {
  const card = getCard(cardId)
  const sizeClass = SIZE_CLASS[size]
  const tokens = SIZE_TOKENS[size]
  const maxName =
    size === 'fill' ? 26 : size === 'hand' ? 18 : size === 'prop' ? 16 : size === 'md' ? 13 : 12

  const bandClass =
    card.kind === 'property'
      ? groupColorMap[card.propertyGroup ?? '']?.color ?? card.color
      : card.color

  const accentLabel = bandLabel(cardId, card.kind, card.propertyGroup)
  const chips =
    card.kind === 'property_wild'
      ? card.wildColors ?? []
      : card.kind === 'rent'
        ? card.rentColors ?? []
        : []
  const visibleChipCount = chipLimit(size)
  const hiddenChipCount = Math.max(0, chips.length - visibleChipCount)

  const style: CSSVarStyle = {
    '--card-pad': tokens.pad,
    '--card-gap': tokens.gap,
    '--card-radius': tokens.radius,
    '--card-band': tokens.band,
    '--card-kicker-size': tokens.kicker,
    '--card-title-size': tokens.title,
    '--card-meta-size': tokens.meta,
    '--card-desc-size': tokens.desc,
    '--card-badge-size': tokens.badge,
    '--card-seal-size': tokens.seal,
    '--card-chip-size': tokens.chip,
    '--card-icon-stroke': tokens.iconStroke,
  }

  return (
    <div
      className={[
        'catalog-card',
        `catalog-card-tone-${card.kind}`,
        sizeClass,
        'aspect-[5/7]',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      title={card.name}
    >
      <div className="catalog-card-frame">
        <div className={`catalog-card-band ${bandClass}`} />
        <div className="catalog-card-topline">
          <span className="catalog-card-kicker">{accentLabel}</span>
          <span className="catalog-card-bank">${card.bankValue}M</span>
        </div>

        <div className="catalog-card-core">
          <div className="catalog-card-seal">
            <div className="catalog-card-glyph">
              {iconForKind(card.kind)}
            </div>
          </div>

          <div className="catalog-card-copy">
            <div className="catalog-card-title">{cap(card.name, maxName)}</div>
            <div className="catalog-card-meta">{kindMeta(card.kind)}</div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="catalog-card-chip-row">
            {chips.slice(0, visibleChipCount).map(color => (
              <span
                key={color}
                className={[
                  'catalog-card-chip',
                  groupColorMap[color]?.color ?? 'bg-slate-500',
                ].join(' ')}
                title={groupDisplayNames[color] ?? color}
              />
            ))}
            {hiddenChipCount > 0 && (
              <span className="catalog-card-chip-more">+{hiddenChipCount}</span>
            )}
          </div>
        )}

        {size === 'fill' && card.description && (
          <p className="catalog-card-description">{card.description}</p>
        )}

        <div className="catalog-card-footer">
          <span className="catalog-card-footer-line" />
          <span className="catalog-card-footer-label">
            {card.kind === 'property'
              ? groupDisplayNames[card.propertyGroup ?? ''] ?? 'Property'
              : card.kind === 'property_wild'
                ? 'Flexible'
                : card.kind === 'rent'
                  ? 'Collect'
                  : card.kind === 'money'
                    ? 'Bank'
                    : 'Execute'}
          </span>
        </div>
      </div>
    </div>
  )
}
