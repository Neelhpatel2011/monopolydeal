'use client'

import { useGame } from '@/contexts/GameContext'
import { getCard } from '@/data/cardCatalog'
import { CatalogCard } from '@/components/game/CatalogCard'

export function ResponseModal() {
  const { state, respondToPending } = useGame()
  const { view, loading } = state

  const prompts = view?.pending_prompts ?? []
  if (prompts.length === 0) return null

  const prompt = prompts[0]
  const actionCard = getCard(prompt.card_id)
  const payload = prompt.payload ?? {}
  const stealCardId = typeof payload.steal_card_id === 'string' ? payload.steal_card_id : null
  const targetCard = stealCardId ? getCard(stealCardId) : null
  const amountOwed = typeof payload.amount === 'number' ? payload.amount : null
  const hasJustSayNo = view?.you.hand.some(id => id === 'action_just_say_no') ?? false

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Response required">
      <div className="modal-panel max-w-3xl w-full">
        <div className="lobby-panel-head">
          <div>
            <span className="lobby-section-kicker">Response Window</span>
            <h2 className="lobby-panel-title">Resolve the incoming action</h2>
          </div>
          <span className="lobby-panel-meta">From {prompt.source_player}</span>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-6">
          {prompt.prompt}
        </p>

        <div className="response-modal-layout mt-5">
          <div className="rounded-[22px] border border-[var(--line)] bg-white/4 p-4">
            <span className="lobby-section-kicker">Action Card</span>
            <div className="mt-3">
              <CatalogCard cardId={prompt.card_id} size="fill" />
            </div>
          </div>

          <div className="rounded-[22px] border border-[var(--line)] bg-white/4 p-4 flex flex-col gap-4">
            <div>
              <span className="lobby-section-kicker">Situation</span>
              <div className="mt-3 flex flex-col gap-3">
                <div className="rounded-[18px] border border-[var(--line)] bg-white/3 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">Card</div>
                  <div className="mt-1 text-base font-semibold text-[var(--text-strong)]">{actionCard.name}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">Played by {prompt.source_player}</div>
                </div>

                {targetCard && (
                  <div className="rounded-[18px] border border-[var(--line)] bg-white/3 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">Target</div>
                    <div className="response-target-layout mt-3">
                      <div className="w-[120px]">
                        <CatalogCard cardId={targetCard.id} size="fill" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-[var(--text-strong)]">{targetCard.name}</div>
                        <div className="mt-1 text-sm text-[var(--text-muted)]">
                          This is the card currently at risk.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {amountOwed !== null && (
                  <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(212,175,55,0.08)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[rgba(212,175,55,0.7)]">If You Accept</div>
                    <div className="mt-1 text-sm text-[var(--text-muted)]">
                      You will owe <span className="font-semibold text-[var(--text-strong)]">${amountOwed}M</span>.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => respondToPending(prompt.pending_id, 'accept')}
                disabled={loading}
                className="btn btn-danger flex-1 min-w-[180px]"
              >
                {loading ? 'Working...' : 'Accept'}
              </button>

              <button
                onClick={() => respondToPending(prompt.pending_id, 'just_say_no')}
                disabled={loading || !hasJustSayNo}
                title={!hasJustSayNo ? "You do not have a Just Say No card." : 'Counter the action.'}
                className="btn btn-warning flex-1 min-w-[180px]"
              >
                {loading ? 'Working...' : 'Play Just Say No'}
              </button>
            </div>

            {!hasJustSayNo && (
              <div className="text-sm text-[var(--text-dim)]">
                You do not currently have a Just Say No card in hand.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
