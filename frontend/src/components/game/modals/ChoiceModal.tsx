'use client'

import { useGame } from '@/contexts/GameContext'
import { groupColorMap, groupDisplayNames } from '@/data/cardCatalog'

export function ChoiceModal() {
  const { state, dispatch } = useGame()
  const { choiceModal, loading } = state

  if (!choiceModal) return null

  if (choiceModal.mode !== 'choose_color') return null

  const allowed = (choiceModal.allowedColors ?? [])
    .filter(Boolean)
    .filter((c, i, arr) => arr.indexOf(c) === i)

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a color"
      onClick={() => dispatch({ type: 'SET_CHOICE_MODAL', modal: null })}
    >
      <div className="modal-panel max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white">Choose color</h2>
        <p className="text-white/50 text-sm mt-1">
          Select the color to set this wild property to.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {allowed.map((color) => (
            <button
              key={color}
              disabled={loading}
              onClick={() => {
                choiceModal.onConfirm(color)
                dispatch({ type: 'SET_CHOICE_MODAL', modal: null })
              }}
              className="btn btn-ghost text-sm justify-start"
              aria-label={`Choose ${groupDisplayNames[color] ?? color}`}
            >
              <span
                className={[
                  'inline-block w-3.5 h-3.5 rounded-[5px] border border-black/25 shadow-sm',
                  groupColorMap[color]?.color ?? 'bg-slate-500',
                ].join(' ')}
                aria-hidden="true"
              />
              <span className="truncate">
                {groupDisplayNames[color] ?? color}
              </span>
            </button>
          ))}
          {allowed.length === 0 && (
            <div className="col-span-2 text-center text-white/40 text-sm py-3">
              No colors available.
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => dispatch({ type: 'SET_CHOICE_MODAL', modal: null })}
            className="btn btn-ghost flex-1"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

