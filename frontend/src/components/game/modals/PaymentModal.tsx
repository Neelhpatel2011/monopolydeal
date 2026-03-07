'use client'

import { useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { getCard, sumBankValue } from '@/data/cardCatalog'

export function PaymentModal() {
  const { state, makePayment } = useGame()
  const { pendingPayment, view, loading } = state

  // Store selections by index so duplicate card IDs don't highlight/select as a group.
  const [selectedBankIdx, setSelectedBankIdx] = useState<number[]>([])
  const [selectedPropIdx, setSelectedPropIdx] = useState<number[]>([])
  const [selectedBuildingIdx, setSelectedBuildingIdx] = useState<number[]>([])

  if (!pendingPayment || !view) return null

  const myTarget = pendingPayment.targets.find(t => t.player_id === view.you.id)
  if (!myTarget) return null

  const amountOwed = myTarget.amount

  const allBankIds = view.you.bank
  const allPropIds = Object.values(view.you.properties).flat()
  const allBuildingIds = Object.values(view.you.buildings).flat()

  const selectedBank = selectedBankIdx.map(i => allBankIds[i]).filter(Boolean)
  const selectedProps = selectedPropIdx.map(i => allPropIds[i]).filter(Boolean)
  const selectedBuildings = selectedBuildingIdx.map(i => allBuildingIds[i]).filter(Boolean)

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

  const confirmEnabled = !loading && (canAffordExact || (allAssetsSelected && totalAssets < amountOwed))

  function toggleIndex(i: number, list: number[], setList: (v: number[]) => void) {
    setList(list.includes(i) ? list.filter(x => x !== i) : [...list, i])
  }

  async function handleConfirm() {
    await makePayment({
      request_id: pendingPayment!.request_id,
      receiver_id: pendingPayment!.receiver_id,
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
      <div className="modal-panel max-w-sm w-full">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Payment Required</h2>
          <p className="text-white/60 text-sm mt-1">
            Pay <span className="text-yellow-300 font-bold">${amountOwed}M</span> to{' '}
            <span className="font-semibold">{pendingPayment.receiver_id}</span>
          </p>
        </div>

        {/* Running total */}
        <div className={`
          flex items-center justify-between rounded-lg px-3 py-2 mb-4 transition-colors
          ${totalSelected >= amountOwed ? 'bg-green-900/30 border border-green-500/30' : 'bg-white/5 border border-white/10'}
        `}>
          <span className="text-sm text-white/60">Selected total:</span>
          <span className={`font-bold text-lg ${totalSelected >= amountOwed ? 'text-green-400' : 'text-yellow-300'}`}>
            ${totalSelected}M
            {totalSelected >= amountOwed && ' ✓'}
          </span>
        </div>

        {/* Bank cards */}
        {allBankIds.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Bank</p>
            <div className="flex flex-wrap gap-2">
              {allBankIds.map((id, i) => {
                const c = getCard(id)
                const sel = selectedBankIdx.includes(i)
                return (
                  <button
                    key={`${id}-${i}`}
                    onClick={() => toggleIndex(i, selectedBankIdx, setSelectedBankIdx)}
                    aria-pressed={sel}
                    aria-label={`${c.name} — $${c.bankValue}M`}
                    className={`
                      rounded-lg px-3 py-1.5 text-sm font-semibold border transition-all
                      ${sel
                        ? 'bg-emerald-700/50 border-emerald-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                      }
                    `}
                  >
                    {c.name} <span className="text-yellow-300">${c.bankValue}M</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Property cards */}
        {allPropIds.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Properties</p>
            <div className="flex flex-wrap gap-2">
              {allPropIds.map((id, i) => {
                const c = getCard(id)
                const sel = selectedPropIdx.includes(i)
                return (
                  <button
                    key={`${id}-${i}`}
                    onClick={() => toggleIndex(i, selectedPropIdx, setSelectedPropIdx)}
                    aria-pressed={sel}
                    aria-label={`${c.name} — $${c.bankValue}M`}
                    className={`
                      rounded-lg px-3 py-1.5 text-sm border transition-all
                      ${sel
                        ? 'bg-orange-700/50 border-orange-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                      }
                    `}
                  >
                    {c.name}{' '}
                    <span className="text-yellow-300">${c.bankValue}M</span>
                    <span className="text-red-400/70 text-xs ml-1">⚠</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-red-400/60 mt-1">⚠ You will lose these properties</p>
          </div>
        )}

        {/* Building cards */}
        {allBuildingIds.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Buildings</p>
            <div className="flex flex-wrap gap-2">
              {allBuildingIds.map((id, i) => {
                const c = getCard(id)
                const sel = selectedBuildingIdx.includes(i)
                return (
                  <button
                    key={`${id}-${i}`}
                    onClick={() => toggleIndex(i, selectedBuildingIdx, setSelectedBuildingIdx)}
                    aria-pressed={sel}
                    aria-label={`${c.name} - $${c.bankValue}M`}
                    className={`
                      rounded-lg px-3 py-1.5 text-sm border transition-all
                      ${sel
                        ? 'bg-sky-700/50 border-sky-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                      }
                    `}
                  >
                    {c.name}{' '}
                    <span className="text-yellow-300">${c.bankValue}M</span>
                    <span className="text-red-400/70 text-xs ml-1">!</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-red-400/60 mt-1">! You will lose these buildings</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleConfirm}
            disabled={!confirmEnabled}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Paying…' : `Confirm Payment`}
          </button>
        </div>

        {totalAssets < amountOwed && (
          <p className="text-white/40 text-xs mt-2 text-center">
            You don&apos;t have enough — select all assets for partial payment
          </p>
        )}
      </div>
    </div>
  )
}
