'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { CatalogCard } from '@/components/game/CatalogCard'

export function DiscardModal() {
  const { state, playAction, dispatch } = useGame()
  const { discardRequired, view, loading } = state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedIds([])
  }, [discardRequired?.required_count, view?.you.hand_count])

  if (!discardRequired || !view) return null

  const required = discardRequired.required_count
  const handIds = view.you.hand

  function toggle(id: string) {
    setSelectedIds(previous =>
      previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id],
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
      <div className="modal-panel max-w-5xl w-full">
        <div className="lobby-panel-head">
          <div>
            <span className="lobby-section-kicker">Hand Limit</span>
            <h2 className="lobby-panel-title">Discard down to size</h2>
          </div>
          <span className="lobby-panel-meta">
            {selectedIds.length}/{required} selected
          </span>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(212,175,55,0.08)] px-5 py-4 mb-5">
          <div className="text-xs uppercase tracking-[0.16em] text-[rgba(212,175,55,0.7)]">Required</div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">
            Select exactly {required} card{required === 1 ? '' : 's'} to discard before ending the turn.
          </div>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))' }}
        >
          {handIds.map((id, index) => {
            const selected = selectedIds.includes(id)

            return (
              <button
                key={`${id}-${index}`}
                onClick={() => toggle(id)}
                aria-pressed={selected}
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

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleConfirm}
            disabled={selectedIds.length !== required || loading}
            className="btn btn-primary flex-1 min-w-[220px]"
          >
            {loading ? 'Discarding...' : `Discard ${selectedIds.length} card${selectedIds.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
