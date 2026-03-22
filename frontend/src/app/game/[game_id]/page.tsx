'use client'

import { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { GameProvider, useGame } from '@/contexts/GameContext'
import { useGameSocket } from '@/lib/socket'
import { api } from '@/lib/api'
import { TurnChip } from '@/components/game/TurnChip'
import { EventLog } from '@/components/game/EventLog'
import { PaymentTrackerTray } from '@/components/game/PaymentTrackerTray'
import { PaymentModal } from '@/components/game/modals/PaymentModal'
import { ResponseModal } from '@/components/game/modals/ResponseModal'
import { DiscardModal } from '@/components/game/modals/DiscardModal'
import { ChoiceModal } from '@/components/game/modals/ChoiceModal'
import { ActionButtons } from '@/components/game/ActionButtons'
import { getCard } from '@/data/cardCatalog'
import { CatalogCard } from '@/components/game/CatalogCard'
import { PlayerHud } from '@/components/game/PlayerHud'
import { InspectPanel } from '@/components/game/InspectPanel'
import { BankPocket } from '@/components/game/BankPocket'
import { CardStack } from '@/components/game/CardStack'
import { SelectedCardStage } from '@/components/game/SelectedCardStage'
import { PropertyOverview } from '@/components/game/PropertyOverview'
import { HandFan } from '@/components/game/HandFan'

const MAX_PLAYERS = 5

function HostBadge({ title = 'Host' }: { title?: string }) {
  return (
    <span className="host-badge host-badge-compact" title={title}>
      <span className="host-crown" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 18h18l-1.6 3H4.6L3 18Zm2.1-10.2 3.7 3.3 3.2-5.1 3.2 5.1 3.7-3.3 1.9 8.1H3.2l1.9-8.1Z" fill="currentColor" />
        </svg>
      </span>
      Host
    </span>
  )
}

function GameBoard({ gameId, playerId }: { gameId: string; playerId: string }) {
  const { state, dispatch, handleStateUpdate, playAction, isMyTurn } = useGame()
  const { view, loading, error, targetPlayerId, selectedCardIds } = state
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [leavingLobby, setLeavingLobby] = useState(false)
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [inspectedOpponentId, setInspectedOpponentId] = useState<string | null>(null)

  const { connected } = useGameSocket({
    gameId,
    playerId,
    onStateUpdate: handleStateUpdate,
    enabled: true,
  })

  useEffect(() => {
    dispatch({ type: 'SET_CONNECTED', connected })
  }, [connected, dispatch])

  useEffect(() => {
    api.getView(gameId, playerId)
      .then(v => dispatch({ type: 'SET_VIEW', view: v }))
      .catch(err => dispatch({ type: 'SET_ERROR', error: err.message }))
  }, [gameId, playerId, dispatch])

  useEffect(() => {
    if (!view || view.others.length === 0) {
      setInspectedOpponentId(null)
      return
    }

    if (targetPlayerId && view.others.some(player => player.id === targetPlayerId)) {
      setInspectedOpponentId(targetPlayerId)
      return
    }

    if (!inspectedOpponentId || !view.others.some(player => player.id === inspectedOpponentId)) {
      setInspectedOpponentId(view.others[0].id)
    }
  }, [inspectedOpponentId, targetPlayerId, view])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

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
      return
    }

    if (overId.startsWith('prop-set-')) {
      const color = overId.replace('prop-set-', '')
      if (card.kind === 'property' || card.kind === 'property_wild') {
        await playAction({ action_type: 'play_property', property_card_id: cardId, property_color: color })
      }
      return
    }

    if (overId.startsWith('new-set-')) {
      const color = overId.replace('new-set-', '')
      if (card.kind === 'property' || card.kind === 'property_wild') {
        await playAction({ action_type: 'play_property', property_card_id: cardId, property_color: color })
      }
    }
  }

  if (view?.game_over) {
    const isWinner = view.game_over.winner_id === playerId
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-panel" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12, color: 'rgba(212,175,55,0.78)' }}>
            {isWinner ? 'W' : 'L'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>
            {isWinner ? 'You Win!' : `${view.game_over.winner_id} Wins!`}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 20 }}>Game over</p>
          <button onClick={() => router.push('/')} className="btn btn-primary" style={{ width: '100%' }}>
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (!view) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }} className="animate-pulse">
          {error ? `Error: ${error}` : 'Loading game...'}
        </div>
      </div>
    )
  }

  const myProps = view.you.properties
  const myBuildings = view.you.buildings
  const allIds = [view.you.id, ...view.others.map(player => player.id)]
  const topCard = view.discard_pile.length > 0 ? view.discard_pile[view.discard_pile.length - 1] : null
  const turnActions = view.turn_actions ?? []
  const lastTurnCard = turnActions.length > 0 ? (turnActions[turnActions.length - 1]?.card_ids?.[0] ?? null) : null
  const activeCardId = lastTurnCard ?? topCard
  const playerCount = 1 + view.others.length
  const selectedPrimaryId = selectedCardIds[0] ?? null
  const selectedCard = selectedPrimaryId ? getCard(selectedPrimaryId) : null
  const draggingCard = draggingCardId ? getCard(draggingCardId) : null
  const isHost = view.host_id === view.you.id

  const showNewSetDropZones = Boolean(
    isMyTurn &&
    (
      (selectedCard && (selectedCard.kind === 'property' || selectedCard.kind === 'property_wild')) ||
      (draggingCard && (draggingCard.kind === 'property' || draggingCard.kind === 'property_wild'))
    )
  )

  const started =
    view.deck_count > 0 ||
    view.discard_pile.length > 0 ||
    view.you.hand_count > 0 ||
    view.you.bank.length > 0 ||
    Object.values(view.you.properties).some(ids => ids.length > 0) ||
    Object.values(view.you.buildings).some(ids => ids.length > 0) ||
    view.others.some(player =>
      player.hand_count > 0 ||
      player.bank.length > 0 ||
      Object.values(player.properties).some(ids => ids.length > 0) ||
      Object.values(player.buildings).some(ids => ids.length > 0)
    )

  const inspectedOpponent =
    (inspectedOpponentId ? view.others.find(player => player.id === inspectedOpponentId) : null) ??
    view.others[0] ??
    null

  function inspectOpponent(playerIdToInspect: string) {
    setInspectedOpponentId(playerIdToInspect)
  }

  function toggleTargetOpponent(playerIdToTarget: string) {
    inspectOpponent(playerIdToTarget)
    dispatch({
      type: 'SET_TARGET_PLAYER',
      playerId: targetPlayerId === playerIdToTarget ? null : playerIdToTarget,
    })
  }

  async function handleStartGame() {
    setStarting(true)
    setLobbyError(null)
    try {
      await api.startGame(gameId, playerId)
      const refreshedView = await api.getView(gameId, playerId)
      dispatch({ type: 'SET_VIEW', view: refreshedView })
    } catch (err) {
      setLobbyError((err as Error).message)
    } finally {
      setStarting(false)
    }
  }

  async function handleLeaveLobby() {
    setLeavingLobby(true)
    setLobbyError(null)
    try {
      await api.leaveGame(gameId, playerId)
      localStorage.removeItem(`player_id_${gameId}`)
      router.push('/')
    } catch (err) {
      setLobbyError((err as Error).message)
      setLeavingLobby(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => setDraggingCardId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="board-root" aria-label="Monopoly Deal game board">
        <header className={`board-nav ${isMyTurn ? 'nav-my-turn' : ''}`}>
          <span className="nav-brand">Monopoly Deal</span>
          <div className="nav-divider" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <TurnChip />
          </div>
          <EventLog />
          {loading && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} className="animate-pulse">
              saving...
            </span>
          )}
          {error && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--danger)',
                flexShrink: 0,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={error}
            >
              Error: {error}
            </span>
          )}
          <div className={`ws-dot ${connected ? 'ws-dot-on' : 'ws-dot-off'}`} title={connected ? 'Connected' : 'Reconnecting...'} />
        </header>

        <div className="player-hud-row">
          {view.others.length === 0 ? (
            <div className="player-hud-row-empty">Waiting for opponents...</div>
          ) : (
            view.others.map((opp) => (
              <PlayerHud
                key={opp.id}
                player={opp}
                allPlayerIds={allIds}
                isActive={view.current_player_id === opp.id}
                isTargeted={targetPlayerId === opp.id}
                isInspected={inspectedOpponent?.id === opp.id}
                isHost={view.host_id === opp.id}
                onInspect={inspectOpponent}
                onToggleTarget={toggleTargetOpponent}
              />
            ))
          )}
        </div>

        <div className="table-frame">
          {!started ? (
            <div className="felt-table board-lobby-shell">
              <div className="lobby-console">
                <div className="lobby-console-head">
                  <div>
                    <div className="lobby-kicker">Game Lobby</div>
                    <div className="lobby-title">Waiting to start</div>
                    <div className="lobby-subtitle">
                      Host controls the start. Share the room link, then begin when everyone is seated.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/game/${gameId}`
                      void navigator.clipboard.writeText(url)
                    }}
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px', fontSize: 11 }}
                  >
                    Copy Link
                  </button>
                </div>

                <div className="lobby-seat-zone">
                  <div className="lobby-seat-head">
                    <span className="zone-label">Players</span>
                    <span className="playmat-zone-meta">{playerCount}/{MAX_PLAYERS} seated</span>
                  </div>

                  <div className="lobby-seat-grid">
                    {allIds.map(pid => {
                      const playerIsHost = view.host_id === pid
                      const you = pid === playerId
                      return (
                        <div key={pid} className={`lobby-seat ${you ? 'lobby-seat-you' : ''}`}>
                          <div className="lobby-seat-copy">
                            <span className="lobby-seat-name">{pid}</span>
                            <span className="lobby-seat-meta">{you ? 'You' : 'Player'}</span>
                          </div>
                          {playerIsHost && <HostBadge title="Lobby host" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {lobbyError && (
                  <div className="lobby-error">
                    {lobbyError}
                  </div>
                )}

                <div className="lobby-actions">
                  <button
                    onClick={handleStartGame}
                    disabled={starting || leavingLobby || playerCount < 2 || !isHost}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {starting ? 'Starting...' : !isHost ? 'Host Only' : playerCount < 2 ? 'Need 2+ Players' : 'Start Game'}
                  </button>
                  <button
                    onClick={handleLeaveLobby}
                    disabled={starting || leavingLobby}
                    className="btn btn-ghost"
                  >
                    {leavingLobby ? 'Leaving...' : 'Leave Lobby'}
                  </button>
                </div>

                <div className="lobby-footnote">
                  {isHost ? 'You are the host.' : `Waiting for ${view.host_id ?? 'the host'} to start.`}
                </div>
              </div>
            </div>
          ) : (
            <div className="felt-table">
              <div className="tabletop-layout">
                <InspectPanel
                  player={inspectedOpponent}
                  allPlayerIds={allIds}
                  hostId={view.host_id}
                />

                <BankPocket bankIds={view.you.bank} />

                <section className="tabletop-center">
                  <div className="tabletop-center-head">
                    <div className="turn-pill">
                      <span className="turn-pill-number">Turn {view.turn_number}</span>
                      <span className="turn-pill-sep" aria-hidden="true" />
                      <span className="turn-pill-player">
                        {view.current_player_id === playerId ? 'Your turn' : `${view.current_player_id ?? 'Starting...'}'s turn`}
                      </span>
                    </div>

                    <div className="action-stack-tray tabletop-action-stack">
                      <div className="action-stack-meta">
                        <span className="action-stack-label">Action Stack</span>
                        <span className="action-stack-name">
                          {turnActions.length === 0
                            ? 'No actions played yet'
                            : turnActions
                              .map(action => {
                                const mainCardId = action.card_ids?.[0]
                                if (!mainCardId) return action.action_type
                                const extraCards = Math.max(0, (action.card_ids?.length ?? 0) - 1)
                                return extraCards > 0 ? `${getCard(mainCardId).name} +${extraCards}` : getCard(mainCardId).name
                              })
                              .join(' / ')}
                        </span>
                      </div>

                      {turnActions.length > 0 && (
                        <div className="action-stack-cards" aria-label="Actions played this turn">
                          {turnActions.slice(-4).map((action, idx, arr) => {
                            const mainCardId = action.card_ids?.[0]
                            if (!mainCardId) return null
                            const extraCards = Math.max(0, (action.card_ids?.length ?? 0) - 1)
                            const stackIndex = (arr.length - 1) - idx
                            const stamp = action.player_id === playerId ? 'YOU' : action.player_id.slice(0, 2).toUpperCase()

                            return (
                              <div
                                key={`${action.player_id}-${action.action_type}-${mainCardId}-${idx}`}
                                className="action-stack-card"
                                style={{
                                  transform: `translate(${stackIndex * -10}px, ${stackIndex * 2}px) rotate(${stackIndex * -2}deg)`,
                                  zIndex: idx,
                                }}
                                title={`${action.player_id}: ${getCard(mainCardId).name}${extraCards > 0 ? ` (+${extraCards})` : ''}`}
                              >
                                <CatalogCard cardId={mainCardId} size="xs" />
                                <span className="action-stack-stamp" aria-hidden="true">{stamp}</span>
                                {extraCards > 0 && <span className="action-stack-plus" aria-hidden="true">+{extraCards}</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tabletop-center-stage">
                    <CardStack label="Deck" count={view.deck_count} mode="deck" />
                    <SelectedCardStage
                      selectedCardId={selectedPrimaryId}
                      activeCardId={activeCardId}
                      targetPlayerId={targetPlayerId}
                      turnActionsCount={turnActions.length}
                      isMyTurn={isMyTurn}
                    />
                    <CardStack
                      label="Discard"
                      count={view.discard_pile.length}
                      topCardId={topCard}
                      mode="discard"
                    />
                  </div>

                  {view.payment_trackers.length > 0 && (
                    <PaymentTrackerTray trackers={view.payment_trackers} playerId={playerId} />
                  )}

                  {view.pending_prompts.length > 0 && (
                    <div className="resolution-banner">
                      <span className="resolution-title">Awaiting Response</span>
                      {view.pending_prompts.map(prompt => (
                        <div key={prompt.pending_id} style={{ marginTop: 4 }}>
                          <div className="resolution-prompt">{prompt.prompt}</div>
                          <div className="resolution-sub">
                            from {prompt.source_player} / {getCard(prompt.card_id).name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isMyTurn && (
                    <div className="command-tray">
                      <ActionButtons />
                    </div>
                  )}
                </section>

                <PropertyOverview
                  properties={myProps}
                  buildings={myBuildings}
                  showNewSetDropZones={showNewSetDropZones}
                />
              </div>
            </div>
          )}
        </div>

        <div className="hand-strip">
          <HandFan />
        </div>
      </div>

      <PaymentModal key={state.pendingPayment?.request_id ?? 'payment-none'} />
      <ResponseModal />
      <DiscardModal />
      <ChoiceModal />
    </DndContext>
  )
}

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
            onSubmit={async event => {
              event.preventDefault()
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
              onChange={event => setJoinName(event.target.value)}
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
                {joining ? 'Joining...' : 'Join'}
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
