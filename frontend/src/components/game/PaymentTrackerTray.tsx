'use client'

import type { PaymentTracker, PaymentTrackerParticipant } from '@/types/api'
import { getCard } from '@/data/cardCatalog'

interface PaymentTrackerTrayProps {
  trackers: PaymentTracker[]
  playerId: string
  compact?: boolean
}

const STATUS_ORDER: Record<PaymentTrackerParticipant['status'], number> = {
  pending: 0,
  partial: 1,
  paid: 2,
  canceled: 3,
}

function getTrackerTitle(tracker: PaymentTracker, playerId: string) {
  const cardName = tracker.card_id ? getCard(tracker.card_id).name : 'Payment'
  if (tracker.receiver_id === playerId) return `${cardName} Collection`
  if (tracker.participants.some(participant => participant.player_id === playerId)) {
    return `${cardName} Charge`
  }
  return `${cardName} Payment`
}

function getTrackerSummary(tracker: PaymentTracker) {
  const activeParticipants = tracker.participants.filter(participant => participant.status !== 'canceled')
  const paidCount = activeParticipants.filter(participant => participant.status === 'paid').length
  const partialCount = activeParticipants.filter(participant => participant.status === 'partial').length
  const pendingCount = activeParticipants.filter(participant => participant.status === 'pending').length

  if (pendingCount > 0) {
    return `${pendingCount} waiting`
  }
  if (partialCount > 0) {
    return `${partialCount} short`
  }
  if (paidCount > 0) {
    return `${paidCount} settled`
  }
  return 'No targets'
}

function getParticipantLabel(participant: PaymentTrackerParticipant, playerId: string) {
  return participant.player_id === playerId ? 'You' : participant.player_id
}

function getParticipantDetail(participant: PaymentTrackerParticipant) {
  if (participant.status === 'paid') return `Paid $${participant.amount}M`
  if (participant.status === 'partial') {
    return `Short $${participant.paid_amount}M / $${participant.amount}M`
  }
  if (participant.status === 'canceled') return 'Blocked'
  if (participant.request_id) return `Owes $${participant.amount}M`
  return `Waiting on response`
}

function getChipVariant(participant: PaymentTrackerParticipant) {
  if (participant.status === 'paid') return 'paid'
  if (participant.status === 'partial') return 'partial'
  if (participant.status === 'canceled') return 'canceled'
  if (participant.request_id) return 'pending'
  return 'waiting'
}

export function PaymentTrackerTray({
  trackers,
  playerId,
  compact = false,
}: PaymentTrackerTrayProps) {
  if (trackers.length === 0) return null

  return (
    <div className={`payment-tracker-tray ${compact ? 'payment-tracker-tray-compact' : ''}`}>
      {trackers.map(tracker => {
        const orderedParticipants = [...tracker.participants].sort((left, right) => {
          const leftIsYou = left.player_id === playerId ? -1 : 0
          const rightIsYou = right.player_id === playerId ? -1 : 0
          if (leftIsYou !== rightIsYou) return leftIsYou - rightIsYou
          const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
          if (statusDelta !== 0) return statusDelta
          return left.player_id.localeCompare(right.player_id)
        })

        return (
          <div key={tracker.group_id} className="payment-tracker-item">
            <div className="payment-tracker-head">
              <div className="payment-tracker-head-copy">
                <span className="payment-tracker-kicker">Settlement</span>
                <span className="payment-tracker-title">{getTrackerTitle(tracker, playerId)}</span>
              </div>
              <span className="payment-tracker-summary">{getTrackerSummary(tracker)}</span>
            </div>

            <div className="payment-tracker-chips">
              {orderedParticipants.map(participant => {
                const variant = getChipVariant(participant)
                return (
                  <div
                    key={`${tracker.group_id}-${participant.player_id}`}
                    className={`payment-tracker-chip payment-tracker-chip-${variant}`}
                    title={`${getParticipantLabel(participant, playerId)}: ${getParticipantDetail(participant)}`}
                  >
                    <span className="payment-tracker-chip-dot" aria-hidden="true" />
                    <span className="payment-tracker-chip-copy">
                      <span className="payment-tracker-chip-name">
                        {getParticipantLabel(participant, playerId)}
                      </span>
                      <span className="payment-tracker-chip-detail">
                        {getParticipantDetail(participant)}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
