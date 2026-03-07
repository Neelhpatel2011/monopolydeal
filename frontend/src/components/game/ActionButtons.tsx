'use client'

import { useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { getCard, groupDisplayNames, groupSetSizes } from '@/data/cardCatalog'

/**
 * Contextual action buttons that appear based on the selected card(s) and game state.
 * Handles the flow: select card → pick options → call API.
 */
export function ActionButtons() {
  const { state, dispatch, playAction, endTurn, isMyTurn, actionsLeft } = useGame()
  const { view, selectedCardIds, targetPlayerId, loading } = state

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showRentColorPicker, setShowRentColorPicker] = useState(false)
  const [showPropertyPicker, setShowPropertyPicker] = useState<'steal' | 'give' | null>(null)
  const [forcedDealStealCardId, setForcedDealStealCardId] = useState<string | null>(null)

  if (!view || !isMyTurn) return null

  const primaryId = selectedCardIds[0]
  const card = primaryId ? getCard(primaryId) : null
  const noSelection = !card

  // ─── End Turn (nothing selected) ─────────────────────────────────────────

  if (noSelection) {
    return (
      <div className="flex items-center justify-center gap-2 py-1">
        <button
          onClick={() => endTurn()}
          disabled={loading || actionsLeft === 3 /* haven't played anything */}
          aria-label="End your turn"
          className="btn btn-ghost text-sm"
        >
          End Turn
        </button>
      </div>
    )
  }

  // ─── Bank any card ────────────────────────────────────────────────────────

  async function bankCard() {
    if (!primaryId) return
    const c = getCard(primaryId)
    if (c.kind === 'property' || c.kind === 'property_wild') {
      dispatch({ type: 'SET_ERROR', error: 'Properties cannot be banked.' })
      return
    }
    const res = await playAction({ action_type: 'play_bank', bank_card_id: primaryId })
    if (res?.status === 'ok') dispatch({ type: 'CLEAR_SELECTION' })
  }

  // ─── Money card ───────────────────────────────────────────────────────────

  if (card.kind === 'money') {
    return (
      <div className="flex gap-2 justify-center py-1">
        <button onClick={bankCard} disabled={loading} className="btn btn-primary text-sm">
          Play to Bank
        </button>
        <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">
          Cancel
        </button>
      </div>
    )
  }

  // ─── Property card ────────────────────────────────────────────────────────

  if (card.kind === 'property') {
    const cardId = primaryId!
    const propertyColor = card.propertyGroup
    async function playProperty() {
      if (!propertyColor) {
        dispatch({ type: 'SET_ERROR', error: 'Property card is missing a property group.' })
        return
      }
      await playAction({ action_type: 'play_property', property_card_id: cardId, property_color: propertyColor })
      dispatch({ type: 'CLEAR_SELECTION' })
    }
    return (
      <div className="flex gap-2 justify-center py-1">
        <button onClick={playProperty} disabled={loading || actionsLeft === 0} className="btn btn-primary text-sm">
          Play as Property
        </button>
        <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">
          Cancel
        </button>
      </div>
    )
  }

  // ─── Wild property card ───────────────────────────────────────────────────

  if (card.kind === 'property_wild') {
    const wildColors = card.wildColors ?? []
    if (showColorPicker) {
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          <span className="text-white/60 text-xs">Choose color to place wild card:</span>
          <div className="flex gap-2 flex-wrap justify-center">
            {wildColors.map(color => (
              <button
                key={color}
                disabled={loading}
                aria-label={`Place as ${groupDisplayNames[color] ?? color}`}
                onClick={async () => {
                  setShowColorPicker(false)
                  await playAction({ action_type: 'play_property', property_card_id: primaryId, property_color: color })
                  dispatch({ type: 'CLEAR_SELECTION' })
                }}
                className="btn btn-ghost text-xs"
              >
                {groupDisplayNames[color] ?? color}
              </button>
            ))}
          </div>
          <button onClick={() => setShowColorPicker(false)} className="btn btn-ghost text-xs">← Back</button>
        </div>
      )
    }
    return (
      <div className="flex gap-2 justify-center py-1">
        <button onClick={() => setShowColorPicker(true)} disabled={loading || actionsLeft === 0} className="btn btn-primary text-sm">
          Place Wild ▾
        </button>
        <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
      </div>
    )
  }

  // ─── Rent card ────────────────────────────────────────────────────────────

  if (card.kind === 'rent') {
    const rentColors = card.rentColors ?? []
    const isMulticolor = card.rentTarget === 'one_player'

    if (showRentColorPicker) {
      // For multicolor, also need a target
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          <span className="text-white/60 text-xs">
            Choose rent color{isMulticolor ? ' (and a target opponent)' : ''}:
          </span>
          <div className="flex gap-2 flex-wrap justify-center">
            {rentColors.map(color => {
              // Only show colors where I have properties
              const myCount = (view.you.properties[color] ?? []).length
              if (myCount === 0) return null
              return (
                <button
                  key={color}
                  disabled={loading || (isMulticolor && !targetPlayerId)}
                  aria-label={`Charge rent on ${groupDisplayNames[color] ?? color}`}
                  onClick={async () => {
                    setShowRentColorPicker(false)
                    const doubleRentIds = selectedCardIds.filter(id => id.startsWith('action_double_the_rent'))
                    await playAction({
                      action_type: 'play_action_counterable',
                      card_id: primaryId,
                      rent_color: color,
                      double_rent_ids: doubleRentIds.length > 0 ? doubleRentIds : undefined,
                      target_player_id: isMulticolor ? (targetPlayerId ?? undefined) : undefined,
                    })
                    dispatch({ type: 'CLEAR_SELECTION' })
                  }}
                  className="btn btn-primary text-xs"
                >
                  {groupDisplayNames[color] ?? color} ({myCount})
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowRentColorPicker(false)} className="btn btn-ghost text-xs">← Back</button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2 items-center py-1">
        {isMulticolor && !targetPlayerId && (
          <span className="text-yellow-300/80 text-xs">Click an opponent to target them first</span>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setShowRentColorPicker(true)}
            disabled={loading || actionsLeft === 0 || (isMulticolor && !targetPlayerId)}
            className="btn btn-primary text-sm"
          >
            Charge Rent ▾
          </button>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">
            Play to Bank
          </button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  // ─── Action cards ─────────────────────────────────────────────────────────

  if (card.kind === 'action') {
    // Pass Go — non-counterable
    if (primaryId === 'action_pass_go') {
      return (
        <div className="flex gap-2 justify-center py-1">
          <button
            onClick={async () => {
              await playAction({ action_type: 'play_action_non_counterable', card_id: primaryId })
              dispatch({ type: 'CLEAR_SELECTION' })
            }}
            disabled={loading || actionsLeft === 0}
            className="btn btn-primary text-sm"
          >
            Draw 2 Cards
          </button>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      )
    }

    // It's My Birthday — non-counterable, targets all
    if (primaryId === 'action_its_my_birthday') {
      return (
        <div className="flex gap-2 justify-center py-1">
          <button
            onClick={async () => {
              await playAction({ action_type: 'play_action_counterable', card_id: primaryId })
              dispatch({ type: 'CLEAR_SELECTION' })
            }}
            disabled={loading || actionsLeft === 0}
            className="btn btn-primary text-sm"
          >
            🎂 Collect $2M from all
          </button>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      )
    }

    // Debt Collector — targets one player
    if (primaryId === 'action_debt_collector') {
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          {!targetPlayerId && (
            <span className="text-yellow-300/80 text-xs">Click an opponent to target them</span>
          )}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await playAction({ action_type: 'play_action_counterable', card_id: primaryId, target_player_id: targetPlayerId ?? undefined })
                dispatch({ type: 'CLEAR_SELECTION' })
              }}
              disabled={loading || actionsLeft === 0 || !targetPlayerId}
              className="btn btn-primary text-sm"
            >
              Collect $5M from {targetPlayerId ?? '?'}
            </button>
            <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )
    }

    // Sly Deal — steal one property (not from full set)
    if (primaryId === 'action_sly_deal') {
      if (showPropertyPicker === 'steal') {
        const targetPlayer = view.others.find(o => o.id === targetPlayerId)
        const stealableProps = targetPlayer
          ? Object.entries(targetPlayer.properties).flatMap(([color, ids]) => {
              if (!ids || ids.length === 0) return []
              const setSize = groupSetSizes[color] ?? getCard(ids[0] ?? '').setSize ?? 3
              return ids.length >= setSize ? [] : ids
            })
          : []
        return (
          <div className="flex flex-col gap-2 items-center py-1">
            <span className="text-white/60 text-xs">Choose a property to steal from {targetPlayerId}:</span>
            <div className="flex gap-2 flex-wrap justify-center max-h-24 overflow-y-auto">
              {stealableProps.map(id => (
                <button key={id} onClick={async () => {
                  setShowPropertyPicker(null)
                  await playAction({ action_type: 'play_action_counterable', card_id: primaryId, target_player_id: targetPlayerId ?? undefined, steal_card_id: id })
                  dispatch({ type: 'CLEAR_SELECTION' })
                }} className="btn btn-primary text-xs">{getCard(id).name}</button>
              ))}
              {stealableProps.length === 0 && (
                <span className="text-white/40 text-xs">No stealable properties (full sets are protected).</span>
              )}
            </div>
            <button onClick={() => setShowPropertyPicker(null)} className="btn btn-ghost text-xs">← Back</button>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          {!targetPlayerId && <span className="text-yellow-300/80 text-xs">Click an opponent to target</span>}
          <div className="flex gap-2">
            <button onClick={() => setShowPropertyPicker('steal')} disabled={!targetPlayerId || loading || actionsLeft === 0} className="btn btn-primary text-sm">
              Steal Property ▾
            </button>
            <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )
    }

    // Forced Deal — swap one property
    if (primaryId === 'action_forced_deal') {
      if (showPropertyPicker === 'steal') {
        const targetPlayer = view.others.find(o => o.id === targetPlayerId)
        const stealable = targetPlayer
          ? Object.entries(targetPlayer.properties).flatMap(([color, ids]) => {
              if (!ids || ids.length === 0) return []
              const setSize = groupSetSizes[color] ?? getCard(ids[0] ?? '').setSize ?? 3
              return ids.length >= setSize ? [] : ids
            })
          : []
        return (
          <div className="flex flex-col gap-2 items-center py-1">
            <span className="text-white/60 text-xs">Choose property to take from {targetPlayerId}:</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {stealable.map(id => (
                <button
                  key={id}
                  onClick={() => {
                    setForcedDealStealCardId(id)
                    setShowPropertyPicker('give')
                  }}
                  className="btn btn-primary text-xs"
                >
                  {getCard(id).name}
                </button>
              ))}
              {stealable.length === 0 && (
                <span className="text-white/40 text-xs">No stealable properties (full sets are protected).</span>
              )}
            </div>
            <button
              onClick={() => {
                setForcedDealStealCardId(null)
                setShowPropertyPicker(null)
              }}
              className="btn btn-ghost text-xs"
            >
              ← Back
            </button>
          </div>
        )
      }
      if (showPropertyPicker === 'give') {
        const stealCardId = forcedDealStealCardId ?? undefined
        const myProps = Object.entries(view.you.properties).flatMap(([color, ids]) => {
          if (!ids || ids.length === 0) return []
          const setSize = groupSetSizes[color] ?? getCard(ids[0] ?? '').setSize ?? 3
          return ids.length >= setSize ? [] : ids
        })
        return (
          <div className="flex flex-col gap-2 items-center py-1">
            <span className="text-white/60 text-xs">Choose your property to give:</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {!stealCardId && (
                <span className="text-white/40 text-xs">Pick a target property first.</span>
              )}
              {stealCardId && myProps.map(id => (
                <button key={id} onClick={async () => {
                  setShowPropertyPicker(null)
                  setForcedDealStealCardId(null)
                  await playAction({ action_type: 'play_action_counterable', card_id: primaryId, target_player_id: targetPlayerId ?? undefined, steal_card_id: stealCardId, give_card_id: id })
                  dispatch({ type: 'CLEAR_SELECTION' })
                }} className="btn btn-warning text-xs">{getCard(id).name}</button>
              ))}
              {stealCardId && myProps.length === 0 && (
                <span className="text-white/40 text-xs">No swappable properties (full sets are protected).</span>
              )}
            </div>
            <button onClick={() => { setForcedDealStealCardId(null); setShowPropertyPicker('steal') }} className="btn btn-ghost text-xs">← Back</button>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          {!targetPlayerId && <span className="text-yellow-300/80 text-xs">Click an opponent to target</span>}
          <div className="flex gap-2">
            <button onClick={() => setShowPropertyPicker('steal')} disabled={!targetPlayerId || loading || actionsLeft === 0} className="btn btn-primary text-sm">
              Swap Property ▾
            </button>
            <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )
    }

    // Deal Breaker — steal full set
    if (primaryId === 'action_deal_breaker') {
          if (showColorPicker) {
        const targetPlayer = view.others.find(o => o.id === targetPlayerId)
        const completeSets = targetPlayer
          ? Object.entries(targetPlayer.properties)
              .filter(([, ids]) => ids.length >= (getCard(ids[0] ?? '')?.setSize ?? 3))
              .map(([color]) => color)
          : []
        return (
          <div className="flex flex-col gap-2 items-center py-1">
            <span className="text-white/60 text-xs">Choose a complete set to steal from {targetPlayerId}:</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {completeSets.map(color => (
                <button key={color} onClick={async () => {
                  setShowColorPicker(false)
                  await playAction({ action_type: 'play_action_counterable', card_id: primaryId, target_player_id: targetPlayerId ?? undefined, steal_color: color })
                  dispatch({ type: 'CLEAR_SELECTION' })
                }} className="btn btn-primary text-xs">{groupDisplayNames[color] ?? color}</button>
              ))}
            </div>
            <button onClick={() => setShowColorPicker(false)} className="btn btn-ghost text-xs">← Back</button>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-2 items-center py-1">
          {!targetPlayerId && <span className="text-yellow-300/80 text-xs">Click an opponent to target</span>}
          <div className="flex gap-2">
            <button onClick={() => setShowColorPicker(true)} disabled={!targetPlayerId || loading || actionsLeft === 0} className="btn btn-danger text-sm">
              Steal Full Set ▾
            </button>
            <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )
    }

    // House / Hotel — pick a color
    if (primaryId === 'action_house' || primaryId === 'action_hotel') {
      const isHotel = primaryId === 'action_hotel'
      const eligibleColors = Object.entries(view.you.properties)
        .filter(([color, ids]) => {
          const setSize = getCard(ids[0] ?? '')?.setSize ?? 3
          const isFullSet = ids.length >= setSize
          if (!isFullSet) return false
          if (isHotel) {
            // need a house already placed
            return (view.you.buildings[color] ?? []).some(id => id.includes('house'))
          }
          return true
        })
        .map(([color]) => color)

      if (showColorPicker) {
        return (
          <div className="flex flex-col gap-2 items-center py-1">
            <span className="text-white/60 text-xs">Choose a property set to add {isHotel ? 'Hotel' : 'House'}:</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {eligibleColors.map(color => (
                <button key={color} onClick={async () => {
                  setShowColorPicker(false)
                  await playAction({ action_type: 'play_action_non_counterable', card_id: primaryId, rent_color: color })
                  dispatch({ type: 'CLEAR_SELECTION' })
                }} className="btn btn-primary text-xs">{groupDisplayNames[color] ?? color}</button>
              ))}
              {eligibleColors.length === 0 && <span className="text-white/40 text-xs">No eligible sets</span>}
            </div>
            <button onClick={() => setShowColorPicker(false)} className="btn btn-ghost text-xs">← Back</button>
          </div>
        )
      }
      return (
        <div className="flex gap-2 justify-center py-1">
          <button onClick={() => setShowColorPicker(true)} disabled={loading || actionsLeft === 0 || eligibleColors.length === 0} className="btn btn-primary text-sm">
            Place {isHotel ? '🏨 Hotel' : '🏠 House'} ▾
          </button>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      )
    }

    // Just Say No — can only be played in the response modal
    if (primaryId === 'action_just_say_no') {
      return (
        <div className="flex gap-2 justify-center py-1 items-center">
          <span className="text-white/40 text-xs">Use Just Say No in the response prompt</span>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      )
    }

    // Double The Rent — attach to rent card in multi-select
    if (primaryId === 'action_double_the_rent') {
      return (
        <div className="flex gap-2 justify-center py-1 items-center">
          <span className="text-white/60 text-xs">Select a Rent card too, then play together</span>
          <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
          <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      )
    }

    // Generic action fallback
    return (
      <div className="flex gap-2 justify-center py-1">
        <button
          onClick={async () => {
            await playAction({ action_type: 'play_action_counterable', card_id: primaryId, target_player_id: targetPlayerId ?? undefined })
            dispatch({ type: 'CLEAR_SELECTION' })
          }}
          disabled={loading || actionsLeft === 0}
          className="btn btn-primary text-sm"
        >
          Play {card.name}
        </button>
        <button onClick={bankCard} disabled={loading || actionsLeft === 0} className="btn btn-ghost text-sm">Bank</button>
        <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })} className="btn btn-ghost text-sm">Cancel</button>
      </div>
    )
  }

  return null
}
