'use client'

import { useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { getCard } from '@/data/cardCatalog'

export function DiscardModal() {
  const { state, playAction, dispatch } = useGame()
  const { discardRequired, view, loading } = state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (!discardRequired || !view) return null

  const required = discardRequired.required_count
  const handIds = view.you.hand

  function toggle(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleConfirm() {
    if (selectedIds.length !== required) return
    await playAction({ action_type: 'discard', discard_ids: selectedIds })
    setSelectedIds([])
    dispatch({ type: 'CLEAR_DISCARD_REQUIRED' })
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Discard required">
      <div className="modal-panel max-w-sm w-full">
        <h2 className="text-lg font-bold text-white mb-1">Discard Cards</h2>
        <p className="text-white/60 text-sm mb-4">
          Select <span className="text-yellow-300 font-bold">{required}</span> card{required !== 1 ? 's' : ''} to discard
          (hand limit: 7)
        </p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
              style={{ width: `${(selectedIds.length / required) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-semibold ${selectedIds.length === required ? 'text-green-400' : 'text-yellow-300'}`}>
            {selectedIds.length}/{required}
          </span>
        </div>

        {/* Hand cards */}
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-4">
          {handIds.map((id, i) => {
            const c = getCard(id)
            const sel = selectedIds.includes(id)
            return (
              <button
                key={`${id}-${i}`}
                onClick={() => toggle(id)}
                aria-pressed={sel}
                aria-label={`${c.name} — select to discard`}
                className={`
                  rounded-lg px-3 py-2 text-sm border transition-all text-left
                  ${sel
                    ? 'bg-red-800/50 border-red-400/60 text-white line-through opacity-70'
                    : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30'
                  }
                `}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-[10px] text-yellow-300">${c.bankValue}M bank</div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedIds.length !== required || loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Discarding…' : `Discard ${selectedIds.length} card${selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
