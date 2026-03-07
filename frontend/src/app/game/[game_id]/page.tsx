'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { GameProvider, useGame } from '@/contexts/GameContext'
import { useGameSocket } from '@/lib/socket'
import { api } from '@/lib/api'
import { TurnChip } from '@/components/game/TurnChip'
import { OpponentCard } from '@/components/game/OpponentCard'
import { PropertySet, NewSetDropZone } from '@/components/game/PropertySet'
import { EventLog } from '@/components/game/EventLog'
import { OpponentSpotlight } from '@/components/game/OpponentSpotlight'
import { PaymentModal } from '@/components/game/modals/PaymentModal'
import { ResponseModal } from '@/components/game/modals/ResponseModal'
import { DiscardModal } from '@/components/game/modals/DiscardModal'
import { ChoiceModal } from '@/components/game/modals/ChoiceModal'
import { ActionButtons } from '@/components/game/ActionButtons'
import PlayersHand from '@/app/game/components/PlayersHand'
import { getCard, sumBankValue } from '@/data/cardCatalog'
import CardBack from '@/components/CardBack'
import { CatalogCard } from '@/components/game/CatalogCard'

const ALL_COLORS = ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility']

// ─── GameBoard ────────────────────────────────────────────────────────────────

function GameBoard({ gameId, playerId }: { gameId: string; playerId: string }) {
  const { state, dispatch, handleStateUpdate, playAction, isMyTurn } = useGame()
  const { view, loading, error, targetPlayerId, selectedCardIds } = state
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)

  // Desktop-only hover spotlight for inspecting opponents' played cards.
  // Must be declared before any early returns to keep hook order stable.
  const [hoverOpponentId, setHoverOpponentId] = useState<string | null>(null)
  const hideSpotlightRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelHideSpotlight() {
    if (hideSpotlightRef.current) {
      clearTimeout(hideSpotlightRef.current)
      hideSpotlightRef.current = null
    }
  }

  function showSpotlight(id: string) {
    cancelHideSpotlight()
    setHoverOpponentId(id)
  }

  function scheduleHideSpotlight() {
    cancelHideSpotlight()
    hideSpotlightRef.current = setTimeout(() => setHoverOpponentId(null), 140)
  }

  useEffect(() => {
    return () => cancelHideSpotlight()
  }, [])

  const { connected } = useGameSocket({
    gameId, playerId, onStateUpdate: handleStateUpdate, enabled: true,
  })

  useEffect(() => { dispatch({ type: 'SET_CONNECTED', connected }) }, [connected, dispatch])

  useEffect(() => {
    api.getView(gameId, playerId)
      .then(v => dispatch({ type: 'SET_VIEW', view: v }))
      .catch(err => dispatch({ type: 'SET_ERROR', error: err.message }))
  }, [gameId, playerId, dispatch])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const { setNodeRef: setBankDropRef, isOver: isOverBankDrop } = useDroppable({
    id: 'bank-drop',
    disabled: !isMyTurn,
  })

  function handleDragStart(event: DragStartEvent) {
    const cardId = (event.active.data.current as { cardId?: string })?.cardId
    setDraggingCardId(cardId ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggingCardId(null)
    const { active, over } = event
    if (!over || !view) return
    const cardId = (active.data.current as { cardId?: string })?.cardId
    if (!cardId) return
    const overId = over.id as string
    const card = getCard(cardId)
    if (overId === 'bank-drop') {
      if (card.kind === 'property' || card.kind === 'property_wild') {
        dispatch({ type: 'SET_ERROR', error: 'Properties cannot be banked.' })
        return
      }
      await playAction({ action_type: 'play_bank', bank_card_id: cardId })
    } else if (overId.startsWith('prop-set-')) {
      const color = overId.replace('prop-set-', '')
      if (card.kind === 'property' || card.kind === 'property_wild') {
        await playAction({ action_type: 'play_property', property_card_id: cardId, property_color: color })
      }
    } else if (overId.startsWith('new-set-')) {
      const color = overId.replace('new-set-', '')
      if (card.kind === 'property' || card.kind === 'property_wild') {
        await playAction({ action_type: 'play_property', property_card_id: cardId, property_color: color })
      }
    }
  }

  // ─── Game Over ──────────────────────────────────────────────────────────────
  if (view?.game_over) {
    const isWinner = view.game_over.winner_id === playerId
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-panel" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{isWinner ? '🏆' : '😔'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>
            {isWinner ? 'You Win!' : `${view.game_over.winner_id} Wins!`}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 20 }}>Game over</p>
          <button onClick={() => router.push('/')} className="btn btn-primary" style={{ width: '100%' }}>Back to Lobby</button>
        </div>
      </div>
    )
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (!view) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }} className="animate-pulse">
          {error ? `⚠ ${error}` : 'Loading game…'}
        </div>
      </div>
    )
  }

  const myProps     = view.you.properties
  const myBuildings = view.you.buildings
  const myBankTotal = sumBankValue(view.you.bank)
  const myColors    = new Set(Object.keys(myProps).filter(c => (myProps[c] ?? []).length > 0))
  const emptyColors = ALL_COLORS.filter(c => !myColors.has(c))
  const allIds      = [view.you.id, ...view.others.map(o => o.id)]
  const topCard     = view.discard_pile.length > 0 ? view.discard_pile[view.discard_pile.length - 1] : null
  const turnActions = view.turn_actions ?? []
  const lastTurnCard = turnActions.length > 0 ? (turnActions[turnActions.length - 1]?.card_ids?.[0] ?? null) : null
  const activeCardId = lastTurnCard ?? topCard
  const playerCount = 1 + view.others.length
  const selectedPrimaryId = selectedCardIds[0] ?? null
  const selectedCard = selectedPrimaryId ? getCard(selectedPrimaryId) : null
  const draggingCard = draggingCardId ? getCard(draggingCardId) : null
  const showNewSetDropZones =
    isMyTurn &&
    (
      (selectedCard && (selectedCard.kind === 'property' || selectedCard.kind === 'property_wild')) ||
      (draggingCard && (draggingCard.kind === 'property' || draggingCard.kind === 'property_wild'))
    )

  const started =
    view.deck_count > 0 ||
    view.discard_pile.length > 0 ||
    view.you.hand_count > 0 ||
    view.you.bank.length > 0 ||
    Object.values(view.you.properties).some(ids => ids.length > 0) ||
    Object.values(view.you.buildings).some(ids => ids.length > 0) ||
    view.others.some(o =>
      o.hand_count > 0 ||
      o.bank.length > 0 ||
      Object.values(o.properties).some(ids => ids.length > 0) ||
      Object.values(o.buildings).some(ids => ids.length > 0)
    )

  const spotlightId = hoverOpponentId ?? targetPlayerId ?? null
  const spotlightPlayer = spotlightId
    ? view.others.find(o => o.id === spotlightId) ?? null
    : null

  async function handleStartGame() {
    setStarting(true)
    setStartError(null)
    try {
      await api.startGame(gameId)
      const v = await api.getView(gameId, playerId)
      dispatch({ type: 'SET_VIEW', view: v })
    } catch (err) {
      setStartError((err as Error).message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => setDraggingCardId(null)}
      onDragEnd={handleDragEnd}
    >
      {/* ═══ BOARD ROOT — flex column, full viewport ═══ */}
      <div className="board-root" aria-label="Monopoly Deal game board">

        {/* ═══ NAVBAR ═══ */}
        <header className={`board-nav ${isMyTurn ? 'nav-my-turn' : ''}`}>
          <span className="nav-brand">Monopoly Deal</span>
          <div className="nav-divider" aria-hidden="true" />
          <div className="flex-1 min-w-0"><TurnChip /></div>
          <EventLog />
          {loading && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} className="animate-pulse">saving…</span>}
          {error && <span style={{ fontSize: 10, color: 'var(--danger)', flexShrink: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>⚠ {error}</span>}
          <div className={`ws-dot ${connected ? 'ws-dot-on' : 'ws-dot-off'}`} title={connected ? 'Connected' : 'Reconnecting…'} />
        </header>

        {/* ═══ OPPONENT RAIL ═══ */}
        <div className="opp-rail">
          {view.others.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Waiting for opponents…</span>
            </div>
          ) : (
            view.others.map((opp, i) => (
              <OpponentCard
                key={opp.id}
                player={opp}
                allPlayerIds={allIds}
                index={i}
                onHoverChange={(pid) => {
                  if (pid) showSpotlight(pid)
                  else scheduleHideSpotlight()
                }}
              />
            ))
          )}
        </div>

        {/* ═══ THE FELT TABLE ═══ */}
        <div className="table-frame">
          <div className="felt-table">

          {/* ── Table play area (deck — center — discard) ── */}
          <div className="table-play-area">

            {/* Deck pile */}
            <div className="pile-area pile-area-deck">
              <div className="pile-socket">
                <div className="pile-visual pile-visual-deck" style={{ width: 'clamp(78px, 9vw, 118px)' }}>
                  <CardBack />
                </div>
              </div>
              <span className="pile-label-text">Deck</span>
              <span className="pile-count-text">{view.deck_count} cards</span>
            </div>

            {/* Center zone: turn pill + resolution + event log */}
            <div className="center-console">
              {/* Turn pill */}
              <div className="turn-pill">
                <span className="turn-pill-number">Turn {view.turn_number}</span>
                <span className="turn-pill-sep" aria-hidden="true" />
                <span className="turn-pill-player">
                  {view.current_player_id === playerId ? '⚡ Your turn' : `${view.current_player_id ?? 'Starting…'}'s turn`}
                </span>
              </div>

              {/* Pending resolution */}
              {!started ? (
                <div
                  className="zone"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    background: 'rgba(0,0,0,0.22)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                        Game Lobby
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>
                        Waiting to start
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/game/${gameId}`
                          void navigator.clipboard.writeText(url)
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '6px 10px', fontSize: 11 }}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Players ({playerCount})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[view.you.id, ...view.others.map(o => o.id)].map(pid => (
                        <span
                          key={pid}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 10px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.78)',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(200,168,90,0.75)' }} />
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>

                  {startError && (
                    <div style={{ color: 'rgba(248,113,113,0.95)', fontSize: 11 }}>
                      {startError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                      onClick={handleStartGame}
                      disabled={starting || playerCount < 2}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      {starting ? 'Starting…' : playerCount < 2 ? 'Need 2+ players' : 'Start Game'}
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="btn btn-ghost"
                    >
                      Back
                    </button>
                  </div>

                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', lineHeight: 1.45 }}>
                    Share the link, have friends join, then start.
                  </div>
                </div>
              ) : (
                <>
                  {/* Center action stack */}
                  <div className="action-stack-tray">
                    <div className="action-stack-meta">
                      <span className="action-stack-label">
                        Action Stack
                      </span>
                      <span className="action-stack-name">
                        {turnActions.length === 0
                          ? 'No actions played yet'
                          : turnActions
                            .map(a => {
                              const main = a.card_ids?.[0]
                              if (!main) return a.action_type
                              const extra = Math.max(0, (a.card_ids?.length ?? 0) - 1)
                              return extra > 0 ? `${getCard(main).name} +${extra}` : getCard(main).name
                            })
                            .join(' · ')
                        }
                      </span>
                    </div>

                    {turnActions.length === 0 ? (
                      <div
                        className="action-stack-icon"
                        style={{ opacity: 0.35 }}
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="action-stack-cards" aria-label="Actions played this turn">
                        {turnActions.slice(-4).map((a, idx, arr) => {
                          const main = a.card_ids?.[0]
                          if (!main) return null
                          const extra = Math.max(0, (a.card_ids?.length ?? 0) - 1)
                          const stackIndex = (arr.length - 1) - idx
                          const stamp = a.player_id === playerId ? 'YOU' : a.player_id.slice(0, 2).toUpperCase()
                          return (
                            <div
                              key={`${a.player_id}-${a.action_type}-${main}-${idx}`}
                              className="action-stack-card"
                              style={{ transform: `translate(${stackIndex * -10}px, ${stackIndex * 2}px) rotate(${stackIndex * -2}deg)`, zIndex: idx }}
                              title={`${a.player_id}: ${getCard(main).name}${extra > 0 ? ` (+${extra})` : ''}`}
                            >
                              <CatalogCard cardId={main} size="xs" />
                              <span className="action-stack-stamp" aria-hidden="true">{stamp}</span>
                              {extra > 0 && (
                                <span className="action-stack-plus" aria-hidden="true">+{extra}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="center-stage">
                    {activeCardId ? (
                      <div className="animate-card-in" style={{ width: 'clamp(176px, 24vw, 320px)' }}>
                        <CatalogCard cardId={activeCardId} size="fill" />
                      </div>
                    ) : (
                      <div className="center-stage-empty">Play a card to begin</div>
                    )}
                  </div>

                  {/* Pending resolution */}
                  {view.pending_prompts.length > 0 && (
                    <div className="resolution-banner">
                      <span className="resolution-title">⏳ Awaiting Response</span>
                      {view.pending_prompts.map(p => (
                        <div key={p.pending_id} style={{ marginTop: 4 }}>
                          <div className="resolution-prompt">{p.prompt}</div>
                          <div className="resolution-sub">from {p.source_player} · {getCard(p.card_id).name}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Command tray (contextual buttons) */}
                  {isMyTurn && (
                    <div className="command-tray">
                      <ActionButtons />
                    </div>
                  )}

                </>
              )}
            </div>

            {/* Discard pile */}
            <div className="pile-area pile-area-discard">
              <div className="pile-socket">
                <div className={`pile-visual ${view.discard_pile.length > 0 ? 'pile-visual-discard' : ''}`} style={{ width: 'clamp(78px, 9vw, 118px)' }}>
                  {topCard ? (
                    <CatalogCard cardId={topCard} size="fill" />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: 10,
                      border: '2px dashed rgba(255,255,255,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.20)',
                    }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.16)' }}>Empty</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="pile-label-text">Discard</span>
              <span className="pile-count-text">{view.discard_pile.length} cards</span>
            </div>

            {spotlightPlayer && (
              <div
                className="opp-spotlight"
                onMouseEnter={cancelHideSpotlight}
                onMouseLeave={scheduleHideSpotlight}
                aria-hidden="true"
              >
                <OpponentSpotlight player={spotlightPlayer} />
              </div>
            )}

          </div>{/* end table play area */}

          {/* ── My zone (bank + properties) at bottom of felt ── */}
          <div className="table-my-zone">
            {/* Bank */}
            <div
              ref={setBankDropRef}
              className={[
                'my-bank-panel bank-dropzone',
                isOverBankDrop ? 'bank-dropzone-over' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="zone-label">Bank</span>
              <span className="bank-total-display">${myBankTotal}M</span>
              <div className="bank-chips-row">
                {view.you.bank.length === 0 ? (
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.16)' }}>Empty</span>
                ) : (
                  view.you.bank.map((id, i) => {
                    const c = getCard(id)
                    return (
                      <span key={`${id}-${i}`} className="bank-chip">
                        <span className={`bank-chip-dot ${c.color}`} aria-hidden="true" />
                        ${c.bankValue}M
                      </span>
                    )
                  })
                )}
              </div>

              {/* Hover: show exact bank cards */}
              {view.you.bank.length > 0 && (
                <div className="bank-hover-panel" aria-hidden="true">
                  <div className="bank-hover-title">Bank Cards</div>
                  <div className="bank-hover-grid">
                    {view.you.bank.map((id, i) => (
                      <div key={`${id}-hover-${i}`} className="bank-hover-card">
                        <CatalogCard cardId={id} size="md" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-zone-divider" aria-hidden="true" />

            {/* Properties */}
            <div className="my-props-panel">
              <span className="zone-label">Properties</span>
              <div className="props-row">
                {Object.entries(myProps)
                  .filter(([, ids]) => ids.length > 0)
                  .map(([color, ids]) => (
                    <PropertySet key={color} color={color} cardIds={ids} buildingIds={myBuildings[color] ?? []} isOwn />
                  ))}
                {showNewSetDropZones && emptyColors.map(color => (
                  <NewSetDropZone key={color} color={color} />
                ))}
                {Object.keys(myProps).length === 0 && emptyColors.length === 0 && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.16)' }}>No properties yet</span>
                )}
              </div>
            </div>
          </div>{/* end my zone */}

          </div>{/* end felt-table */}
        </div>{/* end table-frame */}

        {/* ═══ HAND STRIP ═══ */}
        <div className="hand-strip">
          <PlayersHand />
        </div>

      </div>{/* end board-root */}

      <PaymentModal key={state.pendingPayment?.request_id ?? 'payment-none'} />
      <ResponseModal />
      <DiscardModal />
      <ChoiceModal />
    </DndContext>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function GamePage({ params }: { params: Promise<{ game_id: string }> }) {
  const { game_id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const playerId =
    searchParams.get('player_id') ??
    (typeof window !== 'undefined' ? localStorage.getItem(`player_id_${game_id}`) : null) ??
    ''

  if (!playerId) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="modal-panel" style={{ maxWidth: 420, width: '100%' }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 6 }}>Join Game</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }} className="font-mono">
            {game_id}
          </p>

          {joinError && (
            <div className="zone" style={{ padding: 10, borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(248,113,113,0.08)', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(248,113,113,0.95)' }}>{joinError}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const name = joinName.trim()
              if (!name) return
              setJoining(true)
              setJoinError(null)
              try {
                const res = await api.joinGame(game_id, name)
                const pid = res.player_id
                localStorage.setItem(`player_id_${game_id}`, pid)
                router.replace(`/game/${game_id}?player_id=${encodeURIComponent(pid)}`)
              } catch (err) {
                setJoinError((err as Error).message)
                setJoining(false)
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              autoFocus
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => router.push('/')} className="btn btn-ghost" style={{ flex: 1 }}>
                Back
              </button>
              <button type="submit" disabled={joining || !joinName.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                {joining ? 'Joining…' : 'Join'}
              </button>
            </div>
          </form>

          <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.45 }}>
            If the game already started, you can only rejoin if you previously joined on this device.
          </p>
        </div>
      </div>
    )
  }

  return (
    <GameProvider gameId={game_id} playerId={playerId}>
      <GameBoard gameId={game_id} playerId={playerId} />
    </GameProvider>
  )
}
