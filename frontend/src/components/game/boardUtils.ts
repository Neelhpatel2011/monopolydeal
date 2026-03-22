import { groupColorMap, groupDisplayNames, groupSetSizes, sumBankValue } from '@/data/cardCatalog'
import type { PlayerPrivateView, PlayerPublicView } from '@/types/api'
import type { PlayerColor } from '@/types/player'

export const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'brown', 'pink', 'purple']
export const PROPERTY_OVERVIEW_COLUMNS = [
  ['red', 'orange', 'yellow', 'green', 'railroad'],
  ['pink', 'dark_blue', 'light_blue', 'utility', 'brown'],
]

export interface PublicSetSummary {
  color: string
  label: string
  count: number
  setSize: number
  isComplete: boolean
  swatch: string
}

type PublicBoardLike = Pick<PlayerPrivateView, 'properties' | 'buildings' | 'bank'> | Pick<PlayerPublicView, 'properties' | 'buildings' | 'bank'>

export function getSeatColor(playerId: string, allPlayerIds: string[]): PlayerColor {
  const index = allPlayerIds.indexOf(playerId)
  return PLAYER_COLORS[(index === -1 ? 0 : index) % PLAYER_COLORS.length]
}

export function getPublicSetSummaries(player: Pick<PublicBoardLike, 'properties'>): PublicSetSummary[] {
  return Object.entries(player.properties)
    .filter(([, cards]) => cards.length > 0)
    .map(([color, cards]) => ({
      color,
      label: groupDisplayNames[color] ?? color,
      count: cards.length,
      setSize: groupSetSizes[color] ?? 3,
      isComplete: cards.length >= (groupSetSizes[color] ?? 3),
      swatch: groupColorMap[color]?.color ?? 'bg-gray-500',
    }))
    .sort((left, right) => {
      if (left.isComplete !== right.isComplete) return left.isComplete ? -1 : 1
      if (left.count !== right.count) return right.count - left.count
      return left.label.localeCompare(right.label)
    })
}

export function getBankTotal(player: Pick<PublicBoardLike, 'bank'>) {
  return sumBankValue(player.bank)
}
