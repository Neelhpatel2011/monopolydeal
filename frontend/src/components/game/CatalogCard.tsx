'use client'

import type { CSSProperties } from 'react'
import { getCard, groupColorMap, groupDisplayNames } from '@/data/cardCatalog'

export type CatalogCardSize = 'xs' | 'sm' | 'md' | 'hand' | 'fill'

const SIZE_CLASS: Record<CatalogCardSize, string> = {
  xs: 'w-[34px]',
  sm: 'w-[44px]',
  md: 'w-[56px]',
  hand: 'w-[76px] sm:w-[82px] md:w-[92px]',
  fill: 'w-full',
}

const SIZE_TOKENS: Record<
  CatalogCardSize,
  {
    label: string
    name: string
    coin: string
    coinText: string
    pad: string
    circlePad: string
  }
> = {
  xs: {
    label: 'text-[6px]',
    name: 'text-[7px]',
    coin: 'w-[16px] h-[16px]',
    coinText: 'text-[7px]',
    pad: 'p-1',
    circlePad: 'p-0.5',
  },
  sm: {
    label: 'text-[7px]',
    name: 'text-[8px]',
    coin: 'w-[18px] h-[18px]',
    coinText: 'text-[8px]',
    pad: 'p-1',
    circlePad: 'p-0.5',
  },
  md: {
    label: 'text-[7px]',
    name: 'text-[9px]',
    coin: 'w-[19px] h-[19px]',
    coinText: 'text-[8px]',
    pad: 'p-1.5',
    circlePad: 'p-1',
  },
  hand: {
    label: 'text-[8px]',
    name: 'text-[10px]',
    coin: 'w-[22px] h-[22px]',
    coinText: 'text-[9px]',
    pad: 'p-1.5',
    circlePad: 'p-1.5',
  },
  fill: {
    label: 'text-[10px]',
    name: 'text-[14px]',
    coin: 'w-[30px] h-[30px]',
    coinText: 'text-[12px]',
    pad: 'p-2',
    circlePad: 'p-2',
  },
}

function cap(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 3)}...` : s
}

function kindLabel(kind: string) {
  if (kind === 'property_wild') return 'WILD'
  return kind.toUpperCase()
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
  const w = SIZE_CLASS[size]
  const t = SIZE_TOKENS[size]

  const base = [
    'catalog-card',
    w,
    'aspect-[5/7]',
    'select-none',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const paperOverlay: CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.45), transparent 52%), radial-gradient(circle at 30% 18%, rgba(0,0,0,0.06), transparent 62%)',
  }

  const darkOverlay: CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 52%), radial-gradient(circle at 30% 18%, rgba(242, 215, 179, 0.10), transparent 62%)',
  }

  const coinBase = [
    'card-coin',
    'absolute',
    'rounded-full',
    'flex',
    'items-center',
    'justify-center',
    t.coin,
    t.coinText,
    'font-black',
    'leading-none',
  ].join(' ')

  const nameMax =
    size === 'fill' ? 28 : size === 'hand' ? 18 : size === 'md' ? 16 : size === 'sm' ? 14 : 12

  const moneyValueText =
    size === 'fill'
      ? 'text-[18px]'
      : size === 'hand'
        ? 'text-[16px]'
        : size === 'md'
          ? 'text-[14px]'
          : size === 'sm'
            ? 'text-[12px]'
            : 'text-[11px]'

  // MONEY: colored background + coin center (always readable)
  if (card.kind === 'money') {
    return (
      <div className={`${base} ${card.color}`} title={card.name}>
        <div className="absolute inset-0 opacity-35" style={paperOverlay} />

        <div className={`${coinBase} top-1 left-1`}>{card.bankValue}M</div>
        <div className={`${coinBase} bottom-1 right-1`}>{card.bankValue}M</div>

        <div className={`absolute inset-0 ${t.pad} flex items-center justify-center`}>
          <div
            className={[
              'w-[88%]',
              'aspect-square',
              'rounded-full',
              'card-medallion',
              'flex',
              'items-center',
              'justify-center',
              t.circlePad,
            ].join(' ')}
          >
            <div className="text-center">
              <div className={`${moneyValueText} font-black text-black`}>
                ${card.bankValue}M
              </div>
              {size === 'fill' && (
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-black/40">
                  MONEY
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PROPERTY / WILD PROPERTY: paper base + color header
  if (card.kind === 'property' || card.kind === 'property_wild') {
    const headerText =
      card.kind === 'property'
        ? groupDisplayNames[card.propertyGroup ?? ''] ?? 'Property'
        : 'Wild'
    const headerInk =
      card.kind === 'property'
        ? groupColorMap[card.propertyGroup ?? '']?.text ?? 'text-white'
        : 'text-white'

    const wildColors = card.wildColors ?? []

    return (
      <div className={`${base} bg-stone-50`} title={card.name}>
        <div className="absolute inset-0 opacity-35" style={paperOverlay} />

        <div className={`${card.color} relative px-1.5 py-1 flex items-center justify-between border-b border-black/20`}>
          <span className={`${t.label} font-black uppercase tracking-wide ${headerInk} truncate`}>
            {headerText}
          </span>
          <span className={`${t.label} font-black text-black/80 rounded px-1.5 leading-none card-value-chip`}>
            {card.bankValue}M
          </span>
        </div>

        <div className={`relative flex-1 ${t.pad} flex flex-col`}>
          <div className="flex-1 flex items-center justify-center">
            <div
              className={[
                'w-[92%]',
                'aspect-square',
                'rounded-full',
                'card-medallion',
                'flex',
                'items-center',
                'justify-center',
                t.circlePad,
              ].join(' ')}
            >
              <span className={`${t.name} font-black text-center leading-tight text-black`}>
                {cap(card.name, nameMax)}
              </span>
            </div>
          </div>

          {card.kind === 'property_wild' && wildColors.length > 0 && (
            <div className="pt-1 flex items-center justify-center gap-1">
              {wildColors.slice(0, size === 'fill' ? 10 : 4).map((c) => (
                <span
                  key={c}
                  className={`${groupColorMap[c]?.color ?? 'bg-slate-400'} w-3 h-3 rounded-sm border border-black/20`}
                  title={groupDisplayNames[c] ?? c}
                />
              ))}
              {wildColors.length > (size === 'fill' ? 10 : 4) && (
                <span className={`${t.label} font-black text-black/40`}>
                  +{wildColors.length - (size === 'fill' ? 10 : 4)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // RENT: dark base + accent line + chips
  if (card.kind === 'rent') {
    const rentColors = card.rentColors ?? []
    return (
      <div className={`${base} bg-slate-950`} title={card.name}>
        <div className="absolute inset-0 opacity-45" style={darkOverlay} />
        <div className={`${card.color} absolute left-0 right-0 top-0 h-[6px]`} />

        <div className={`${coinBase} top-1 left-1`}>{card.bankValue}M</div>
        <div className={`${coinBase} bottom-1 right-1`}>{card.bankValue}M</div>

        <div className={`relative ${t.pad} h-full flex flex-col`}>
          <div className="flex items-center justify-center">
            <span className={`${t.label} font-black uppercase tracking-[0.18em] text-white/70`}>
              RENT
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div
              className={[
                'w-[92%]',
                'aspect-square',
                'rounded-full',
                'card-medallion-dark',
                'flex',
                'items-center',
                'justify-center',
                t.circlePad,
              ].join(' ')}
            >
              <span className={`${t.name} font-black text-center leading-tight text-white/95`}>
                {cap(card.name, nameMax)}
              </span>
            </div>
          </div>

          {rentColors.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 pt-1">
              {rentColors.slice(0, size === 'fill' ? 10 : 6).map((c) => (
                <span
                  key={c}
                  className={`${groupColorMap[c]?.color ?? 'bg-slate-500'} w-3 h-3 rounded-sm border border-black/30`}
                  title={groupDisplayNames[c] ?? c}
                />
              ))}
            </div>
          )}

          {size === 'fill' && card.description && (
            <p className="mt-2 text-[11px] text-center text-white/55 leading-snug">{card.description}</p>
          )}
        </div>
      </div>
    )
  }

  // ACTION: paper base + accent line + classic "paper action" look
  return (
    <div className={`${base} ${card.lighterColor}`} title={card.name}>
      <div className="absolute inset-0 opacity-35" style={paperOverlay} />
      <div className={`${card.color} absolute left-0 right-0 top-0 h-[6px]`} />
      <div className={`${card.color} absolute left-0 right-0 bottom-0 h-[6px] opacity-70`} />

      <div className={`${coinBase} top-1 left-1`}>{card.bankValue}M</div>
      <div className={`${coinBase} bottom-1 right-1`}>{card.bankValue}M</div>

      <div className={`relative ${t.pad} h-full flex flex-col`}>
        <div className="flex items-center justify-center">
          <span className={`${t.label} font-black uppercase tracking-[0.18em] text-black/45`}>
            ACTION
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div
            className={[
              'w-[92%]',
              'aspect-square',
              'rounded-full',
              'card-medallion',
              'flex',
              'items-center',
              'justify-center',
              t.circlePad,
            ].join(' ')}
          >
            <span className={`${t.name} font-black text-center leading-tight text-black`}>
              {cap(card.name, nameMax)}
            </span>
          </div>
        </div>

        {size === 'fill' && card.description && (
          <p className="mt-2 text-[11px] text-center text-black/55 leading-snug">{card.description}</p>
        )}

        {size === 'fill' && (
          <div className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-black/35 text-center">
            {kindLabel(card.kind)}
          </div>
        )}
      </div>
    </div>
  )
}
