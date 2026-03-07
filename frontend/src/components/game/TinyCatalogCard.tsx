'use client'

import { CatalogCard } from '@/components/game/CatalogCard'

type TinyCardSize = 'xs' | 'sm' | 'md'

export function TinyCatalogCard({
  cardId,
  size = 'sm',
  className = '',
}: {
  cardId: string
  size?: TinyCardSize
  className?: string
}) {
  return <CatalogCard cardId={cardId} size={size} className={className} />
}
