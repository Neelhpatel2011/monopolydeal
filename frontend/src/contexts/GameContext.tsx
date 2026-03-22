'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type {
  PlayerView,
  ActionRequest,
  ActionResponse,
  PaymentRequest,
  PaymentRequestPayload,
  DiscardRequired,
} from '@/types/api'
import { api } from '@/lib/api'
import { getCard } from '@/data/cardCatalog'

// ─── State ────────────────────────────────────────────────────────────────────

export interface GameUIState {
  gameId: string
  playerId: string
  view: PlayerView | null
  /** Card IDs selected in hand (multi for Double Rent) */
  selectedCardIds: string[]
  /** Target opponent for counterable actions */
  targetPlayerId: string | null
  /** Rent color chosen for a rent/multicolor rent card */
  targetColor: string | null
  /** Active payment request waiting for player to pay */
  pendingPayment: PaymentRequestPayload | null
  /** Active discard requirement */
  discardRequired: DiscardRequired | null
  /** Loading flag for async API calls */
  loading: boolean
  /** Last API error */
  error: string | null
  /** WebSocket connected */
  connected: boolean
  /** Recent event log entries */
  eventLog: string[]
  /** Whether the event log panel is collapsed */
  eventLogCollapsed: boolean
  /** Card selection mode for choice modals */
  choiceModal: ChoiceModalState | null
}

export type ChoiceModalMode =
  | 'choose_target_property'   // pick a specific property card from a target player
  | 'choose_give_property'     // pick a property from your own set to give away
  | 'choose_color'             // pick a color (for wild placement / deal breaker target)
  | 'choose_steal_set'         // pick a full set color to steal (Deal Breaker)

export interface ChoiceModalState {
  mode: ChoiceModalMode
  targetPlayerId?: string
  allowedColors?: string[]
  onConfirm: (value: string) => void
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_VIEW'; view: PlayerView }
  | { type: 'SET_CONNECTED'; connected: boolean }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'DESELECT_CARD'; cardId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_TARGET_PLAYER'; playerId: string | null }
  | { type: 'SET_TARGET_COLOR'; color: string | null }
  | { type: 'SET_PENDING_PAYMENT'; payment: PaymentRequestPayload }
  | { type: 'CLEAR_PENDING_PAYMENT' }
  | { type: 'SET_DISCARD_REQUIRED'; discard: DiscardRequired }
  | { type: 'CLEAR_DISCARD_REQUIRED' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'APPEND_LOG'; message: string }
  | { type: 'TOGGLE_EVENT_LOG' }
  | { type: 'SET_CHOICE_MODAL'; modal: ChoiceModalState | null }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: GameUIState, action: Action): GameUIState {
  switch (action.type) {
    case 'SET_VIEW': {
      const view = action.view
      // When state updates arrive via WS, clear resolved pending states
      const newState: GameUIState = { ...state, view, error: null }
      // If the game is over, clear selections
      if (view.game_over) newState.selectedCardIds = []
      // Auto-clear discard requirement once the hand is within limit again
      if (state.discardRequired && view.you.hand_count <= 7) newState.discardRequired = null
      // Auto-clear payment if the outstanding request is gone/resolved.
      if (state.pendingPayment) {
        const stillPending = (view.payment_trackers ?? []).some(tracker =>
          tracker.participants.some(participant =>
            participant.player_id === state.playerId &&
            participant.status === 'pending' &&
            participant.request_id === state.pendingPayment?.request_id
          )
        )
        if (!stillPending || view.game_over) {
          newState.pendingPayment = null
        }
      }
      return newState
    }
    case 'SET_CONNECTED':
      return { ...state, connected: action.connected }
    case 'SELECT_CARD': {
      const already = state.selectedCardIds.includes(action.cardId)
      if (already) return state
      return { ...state, selectedCardIds: [...state.selectedCardIds, action.cardId] }
    }
    case 'DESELECT_CARD':
      return { ...state, selectedCardIds: state.selectedCardIds.filter(id => id !== action.cardId) }
    case 'CLEAR_SELECTION':
      return { ...state, selectedCardIds: [], targetPlayerId: null, targetColor: null }
    case 'SET_TARGET_PLAYER':
      return { ...state, targetPlayerId: action.playerId }
    case 'SET_TARGET_COLOR':
      return { ...state, targetColor: action.color }
    case 'SET_PENDING_PAYMENT':
      return { ...state, pendingPayment: action.payment, loading: false }
    case 'CLEAR_PENDING_PAYMENT':
      return { ...state, pendingPayment: null }
    case 'SET_DISCARD_REQUIRED':
      return { ...state, discardRequired: action.discard, loading: false }
    case 'CLEAR_DISCARD_REQUIRED':
      return { ...state, discardRequired: null }
    case 'SET_LOADING':
      return { ...state, loading: action.loading, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'APPEND_LOG': {
      const log = [action.message, ...state.eventLog].slice(0, 20)
      return { ...state, eventLog: log }
    }
    case 'TOGGLE_EVENT_LOG':
      return { ...state, eventLogCollapsed: !state.eventLogCollapsed }
    case 'SET_CHOICE_MODAL':
      return { ...state, choiceModal: action.modal }
    default:
      return state
  }
}

function makeInitialState(gameId: string, playerId: string): GameUIState {
  return {
    gameId,
    playerId,
    view: null,
    selectedCardIds: [],
    targetPlayerId: null,
    targetColor: null,
    pendingPayment: null,
    discardRequired: null,
    loading: false,
    error: null,
    connected: false,
    eventLog: [],
    eventLogCollapsed: true,
    choiceModal: null,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameUIState
  dispatch: React.Dispatch<Action>
  // High-level action helpers
  handleStateUpdate: (view: PlayerView) => void
  playAction: (req: Omit<ActionRequest, 'player_id'>) => Promise<ActionResponse | null>
  respondToPending: (pendingId: string, response: 'accept' | 'just_say_no') => Promise<void>
  makePayment: (req: Omit<PaymentRequest, 'payer_id'>) => Promise<void>
  endTurn: () => Promise<void>
  isMyTurn: boolean
  actionsLeft: number
}

const GameContext = createContext<GameContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface GameProviderProps {
  gameId: string
  playerId: string
  children: React.ReactNode
}

export function GameProvider({ gameId, playerId, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(reducer, makeInitialState(gameId, playerId))

  /** Called by WebSocket hook on every state_update message */
  const handleStateUpdate = useCallback((view: PlayerView) => {
    dispatch({ type: 'SET_VIEW', view })
  }, [dispatch])

  /** Execute a game action and handle all response types */
  const playAction = useCallback(async (
    req: Omit<ActionRequest, 'player_id'>
  ): Promise<ActionResponse | null> => {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const res = await api.playAction(gameId, { ...req, player_id: playerId })
      dispatch({ type: 'SET_LOADING', loading: false })

      if (res.status === 'error') {
        dispatch({ type: 'SET_ERROR', error: res.message ?? 'Action failed' })
        return res
      }

      // Update view if provided
      if (res.player_view) dispatch({ type: 'SET_VIEW', view: res.player_view })

      // Handle response-specific states
      if (res.response_type === 'payment_required' && res.payment_request) {
        // The current player initiated an action that requires payment from others.
        // Other players will see their payment modals via WS + their own pending_prompts.
        // For birthday/debt collector the initiator doesn't pay; for rent same.
        // Just log it.
        dispatch({ type: 'APPEND_LOG', message: logFromResponse(res) })
      } else if (res.response_type === 'discard_required' && res.discard_required) {
        dispatch({ type: 'SET_DISCARD_REQUIRED', discard: res.discard_required })
        dispatch({ type: 'APPEND_LOG', message: 'Discard required to end turn.' })
      } else if (res.response_type === 'action_resolved') {
        dispatch({ type: 'CLEAR_SELECTION' })
        dispatch({ type: 'APPEND_LOG', message: logFromResponse(res) })
      } else if (res.response_type === 'response_required') {
        dispatch({ type: 'CLEAR_SELECTION' })
        dispatch({ type: 'APPEND_LOG', message: logFromResponse(res) })
      }

      // Game over
      if (res.game_over) {
        dispatch({ type: 'APPEND_LOG', message: `🏆 ${res.game_over.winner_id} wins!` })
      }

      return res
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message })
      return null
    }
  }, [dispatch, gameId, playerId])

  const respondToPending = useCallback(async (
    pendingId: string,
    response: 'accept' | 'just_say_no'
  ) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const res = await api.respondPending(gameId, pendingId, { pending_id: pendingId, player_id: playerId, response })
      dispatch({ type: 'SET_LOADING', loading: false })

      if (res.status === 'error') {
        dispatch({ type: 'SET_ERROR', error: res.message ?? 'Response failed' })
        return
      }
      if (res.player_view) dispatch({ type: 'SET_VIEW', view: res.player_view })

      if (res.response_type === 'payment_required' && res.payment_request) {
        // Find if I am a payer
        const myTarget = res.payment_request.targets.find(t => t.player_id === playerId)
        if (myTarget) {
          dispatch({ type: 'SET_PENDING_PAYMENT', payment: res.payment_request })
        }
      }
      dispatch({ type: 'APPEND_LOG', message: response === 'just_say_no' ? `${playerId} played Just Say No!` : `${playerId} accepted.` })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message })
    }
  }, [dispatch, gameId, playerId])

  const makePayment = useCallback(async (
    req: Omit<PaymentRequest, 'payer_id'>
  ) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const res = await api.makePayment(gameId, { ...req, payer_id: playerId })
      dispatch({ type: 'SET_LOADING', loading: false })

      if (res.status === 'error') {
        dispatch({ type: 'SET_ERROR', error: res.message ?? 'Payment failed' })
        return
      }
      dispatch({ type: 'CLEAR_PENDING_PAYMENT' })
      if (res.player_view) dispatch({ type: 'SET_VIEW', view: res.player_view })
      dispatch({ type: 'APPEND_LOG', message: `${playerId} paid.` })

      if (res.game_over) {
        dispatch({ type: 'APPEND_LOG', message: `🏆 ${res.game_over.winner_id} wins!` })
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message })
    }
  }, [dispatch, gameId, playerId])

  const endTurn = useCallback(async () => {
    await playAction({ action_type: 'end_turn' })
  }, [playAction])

  const isMyTurn = state.view?.current_player_id === playerId
  const actionsLeft = Math.max(0, 3 - (state.view?.actions_taken ?? 0))

  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      handleStateUpdate,
      playAction,
      respondToPending,
      makePayment,
      endTurn,
      isMyTurn,
      actionsLeft,
    }}>
      {children}
    </GameContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logFromResponse(res: ActionResponse): string {
  if (res.log) {
    const log = res.log as Record<string, unknown>
    if (typeof log.message === 'string') return log.message
    if (typeof log.action === 'string') {
      const card = log.card_id ? getCard(log.card_id as string).name : ''
      return `${log.player ?? '?'} played ${card || log.action}`
    }
  }
  return `Action: ${res.response_type}`
}
