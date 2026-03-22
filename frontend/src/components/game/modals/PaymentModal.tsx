'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { getCard, sumBankValue } from '@/data/cardCatalog'
import type { PaymentRequestPayload, PaymentTracker, PlayerView } from '@/types/api'
import { PaymentTrackerTray } from '@/components/game/PaymentTrackerTray'
import { CatalogCard } from '@/components/game/CatalogCard'

function derivePendingPayment(
  pendingPayment: PaymentRequestPayload | null,
  view: PlayerView,
): PaymentRequestPayload | null {
  if (pendingPayment) return pendingPayment

  for (const tracker of view.payment_trackers ?? []) {
    const participant = tracker.participants.find(
      candidate =>
        candidate.player_id === view.you.id &&
        candidate.status === 'pending' &&
        Boolean(candidate.request_id),
    )

    if (!participant?.request_id) continue

    return {
      request_id: participant.request_id,
      receiver_id: tracker.receiver_id,
      targets: [{ player_id: participant.player_id, amount: participant.amount }],
      group_id: tracker.group_id,
      source_player: tracker.source_player_id,
      card_id: tracker.card_id ?? null,
    }
  }

  return null
}

function findTracker(
  payment: PaymentRequestPayload,
  trackers: PaymentTracker[],
): PaymentTracker | null {
  return (
    trackers.find(tracker => tracker.group_id === payment.group_id) ??
    trackers.find(tracker =>
      tracker.participants.some(participant => participant.request_id === payment.request_id),
    ) ??
    null
  )
}

interface SelectableAssetGridProps {
  title: string
  subtitle: string
  ids: string[]
  selectedIndexes: number[]
  toggleIndex: (index: number) => void
}

function SelectableAssetGrid({
  title,
  subtitle,
  ids,
  selectedIndexes,
  toggleIndex,
}: SelectableAssetGridProps) {
  if (ids.length === 0) return null

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-white/4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="lobby-section-kicker">{title}</span>
          <div className="mt-2 text-sm text-[var(--text-dim)]">{subtitle}</div>
        </div>
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
          {selectedIndexes.length}/{ids.length} selected
        </div>
      </div>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}
      >
        {ids.map((id, index) => {
          const selected = selectedIndexes.includes(index)
          const card = getCard(id)

          return (
            <button
              key={`${id}-${index}`}
              onClick={() => toggleIndex(index)}
              aria-pressed={selected}
              aria-label={`${card.name} / $${card.bankValue}M`}
              className={[
                'rounded-[20px] border p-2 transition-all',
                selected
                  ? 'border-[rgba(212,175,55,0.32)] bg-[rgba(212,175,55,0.08)]'
                  : 'border-[var(--line)] bg-white/3 hover:border-[rgba(212,175,55,0.22)]',
              ].join(' ')}
            >
              <CatalogCard cardId={id} size="fill" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PaymentModal() {
  const { state, makePayment } = useGame()
  const { pendingPayment, view, loading } = state

  const [selectedBankIdx, setSelectedBankIdx] = useState<number[]>([])
  const [selectedPropIdx, setSelectedPropIdx] = useState<number[]>([])
  const [selectedBuildingIdx, setSelectedBuildingIdx] = useState<number[]>([])

  const activePayment = view ? derivePendingPayment(pendingPayment, view) : null
  const paymentRequestId = activePayment?.request_id ?? null

  useEffect(() => {
    setSelectedBankIdx([])
    setSelectedPropIdx([])
    setSelectedBuildingIdx([])
  }, [paymentRequestId])

  if (!view || !activePayment) return null

  const paymentRequest = activePayment
  const myTarget = paymentRequest.targets.find(target => target.player_id === view.you.id)
  if (!myTarget) return null

  const tracker = findTracker(paymentRequest, view.payment_trackers ?? [])
  const amountOwed = myTarget.amount

  const allBankIds = view.you.bank
  const allPropIds = Object.values(view.you.properties).flat()
  const allBuildingIds = Object.values(view.you.buildings).flat()

  const selectedBank = selectedBankIdx.map(index => allBankIds[index]).filter(Boolean)
  const selectedProps = selectedPropIdx.map(index => allPropIds[index]).filter(Boolean)
  const selectedBuildings = selectedBuildingIdx.map(index => allBuildingIds[index]).filter(Boolean)

  const totalSelected =
    sumBankValue(selectedBank) +
    sumBankValue(selectedProps) +
    sumBankValue(selectedBuildings)

  const totalAssets =
    sumBankValue(allBankIds) +
    sumBankValue(allPropIds) +
    sumBankValue(allBuildingIds)

  const canAffordExact = totalSelected >= amountOwed
  const allAssetsSelected =
    selectedBankIdx.length === allBankIds.length &&
    selectedPropIdx.length === allPropIds.length &&
    selectedBuildingIdx.length === allBuildingIds.length

  const confirmEnabled =
    !loading && (canAffordExact || (allAssetsSelected && totalAssets < amountOwed))

  function toggleIndex(
    index: number,
    values: number[],
    setValues: (next: number[]) => void,
  ) {
    setValues(values.includes(index) ? values.filter(value => value !== index) : [...values, index])
  }

  async function handleConfirm() {
    await makePayment({
      request_id: paymentRequest.request_id,
      receiver_id: paymentRequest.receiver_id,
      bank: selectedBank,
      properties: selectedProps,
      buildings: selectedBuildings,
    })
    setSelectedBankIdx([])
    setSelectedPropIdx([])
    setSelectedBuildingIdx([])
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Payment required">
      <div className="modal-panel max-w-6xl w-full">
        <div className="lobby-panel-head">
          <div>
            <span className="lobby-section-kicker">Payment Required</span>
            <h2 className="lobby-panel-title">Assemble your payment</h2>
          </div>
          <span className="lobby-panel-meta">
            Pay ${amountOwed}M to {paymentRequest.receiver_id}
          </span>
        </div>

        {tracker && (
          <div className="mb-5">
            <PaymentTrackerTray trackers={[tracker]} playerId={view.you.id} compact />
          </div>
        )}

        <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(212,175,55,0.08)] px-5 py-4 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[rgba(212,175,55,0.7)]">Selected Total</div>
            <div className="mt-1 text-sm text-[var(--text-dim)]">
              Submit enough assets to cover the charge, or all assets if you cannot fully pay.
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-[var(--text-strong)]">${totalSelected}M</div>
            <div className="text-sm text-[var(--text-dim)]">
              {canAffordExact ? 'Charge covered' : `${Math.max(amountOwed - totalSelected, 0)}M remaining`}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <SelectableAssetGrid
            title="Bank"
            subtitle="Safe cash values already banked."
            ids={allBankIds}
            selectedIndexes={selectedBankIdx}
            toggleIndex={index => toggleIndex(index, selectedBankIdx, setSelectedBankIdx)}
          />

          <SelectableAssetGrid
            title="Properties"
            subtitle="Selected property cards will transfer if submitted."
            ids={allPropIds}
            selectedIndexes={selectedPropIdx}
            toggleIndex={index => toggleIndex(index, selectedPropIdx, setSelectedPropIdx)}
          />

          <SelectableAssetGrid
            title="Buildings"
            subtitle="Buildings transfer with the submitted payment."
            ids={allBuildingIds}
            selectedIndexes={selectedBuildingIdx}
            toggleIndex={index => toggleIndex(index, selectedBuildingIdx, setSelectedBuildingIdx)}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={handleConfirm} disabled={!confirmEnabled} className="btn btn-primary flex-1 min-w-[220px]">
            {loading ? 'Submitting...' : 'Confirm Payment'}
          </button>
        </div>

        {totalAssets < amountOwed && (
          <div className="mt-3 text-sm text-[var(--text-dim)]">
            You do not have enough value to cover the full amount. Select every remaining asset to make a legal short payment.
          </div>
        )}
      </div>
    </div>
  )
}
