'use client'

import { useGame } from '@/contexts/GameContext'
import { getCard } from '@/data/cardCatalog'

export function ResponseModal() {
  const { state, respondToPending } = useGame()
  const { view, loading } = state

  // Only show if there are pending prompts for ME
  const prompts = view?.pending_prompts ?? []
  if (prompts.length === 0) return null

  const prompt = prompts[0]
  const actionCard = getCard(prompt.card_id)
  const payload = prompt.payload ?? {}
  const stealCardId = typeof payload.steal_card_id === 'string' ? payload.steal_card_id : null
  const targetCard = stealCardId ? getCard(stealCardId) : null

  // Check if I have a Just Say No in hand
  const hasJSN = view?.you.hand.some(id => id === 'action_just_say_no') ?? false

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Response required">
      <div className="modal-panel max-w-sm w-full">
        <h2 className="text-lg font-bold text-white mb-1">Response Required</h2>

        {/* Card played */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 mb-4">
          <div className={`${actionCard.color} w-12 h-16 rounded-lg flex items-center justify-center shrink-0 border-2 border-black/30`}>
            <span className="text-white text-[9px] font-bold text-center px-0.5 leading-tight">{actionCard.name}</span>
          </div>
          <div>
            <p className="text-white/80 text-sm font-semibold">{actionCard.name}</p>
            <p className="text-white/50 text-xs mt-0.5">played by <span className="text-white/80 font-medium">{prompt.source_player}</span></p>
            <p className="text-white/60 text-xs mt-1 italic">{prompt.prompt}</p>
          </div>
        </div>

        {/* Targeted card (e.g. Sly Deal / Forced Deal) */}
        {targetCard && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 mb-4">
            <div className={`${targetCard.color} w-12 h-16 rounded-lg flex items-center justify-center shrink-0 border-2 border-black/30`}>
              <span className="text-white text-[9px] font-bold text-center px-0.5 leading-tight">{targetCard.name}</span>
            </div>
            <div>
              <p className="text-white/80 text-sm font-semibold">Target: {targetCard.name}</p>
              <p className="text-white/50 text-xs mt-0.5">This is the card they’re trying to take.</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => respondToPending(prompt.pending_id, 'accept')}
            disabled={loading}
            className="btn btn-danger flex-1"
          >
            {loading ? '…' : 'Accept'}
          </button>

          <button
            onClick={() => respondToPending(prompt.pending_id, 'just_say_no')}
            disabled={loading || !hasJSN}
            title={!hasJSN ? "You don't have a Just Say No card" : 'Counter with Just Say No!'}
            className="btn btn-warning flex-1"
          >
            {loading ? '…' : 'Just Say No! 🚫'}
          </button>
        </div>

        {!hasJSN && (
          <p className="text-white/30 text-xs text-center mt-2">
            You don&apos;t have a Just Say No card
          </p>
        )}
      </div>
    </div>
  )
}

