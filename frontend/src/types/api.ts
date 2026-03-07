// ─── Game Summary ─────────────────────────────────────────────────────────────

export interface GameSummary {
  /** Backend uses game_id, not id */
  game_id: string
  player_ids: string[]
  started: boolean
}

export interface CreateGameRequest {
  player_name: string
}

export interface JoinGameResponse {
  player_id: string
  player_view: PlayerView
}

// ─── Player Views ─────────────────────────────────────────────────────────────

export interface PlayerPrivateView {
  id: string
  hand_count: number
  hand: string[]                          // actual card IDs
  bank: string[]
  properties: Record<string, string[]>   // color → card IDs
  buildings: Record<string, string[]>    // color → building card IDs
}

export interface PlayerPublicView {
  id: string
  hand_count: number
  bank: string[]
  properties: Record<string, string[]>
  buildings: Record<string, string[]>
}

export interface PendingPrompt {
  pending_id: string
  source_player: string
  card_id: string
  prompt: string
  payload?: {
    rent_color?: string | null
    double_rent_ids?: string[] | null
    steal_card_id?: string | null
    give_card_id?: string | null
    steal_color?: string | null
    amount?: number | null
  }
}

export interface TurnAction {
  player_id: string
  action_type: string
  card_ids: string[]
}

export interface PlayerView {
  game_id: string
  you: PlayerPrivateView
  others: PlayerPublicView[]
  pending_prompts: PendingPrompt[]
  turn_actions: TurnAction[]
  deck_count: number
  discard_pile: string[]
  current_player_id: string | null
  turn_number: number
  actions_taken: number
  game_over?: { winner_id: string }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type ActionType =
  | 'play_bank'
  | 'play_property'
  | 'change_wild'
  | 'discard'
  | 'end_turn'
  | 'play_action_counterable'
  | 'play_action_non_counterable'

export interface ActionRequest {
  action_type: ActionType
  player_id: string
  // Property
  property_card_id?: string
  property_color?: string
  // Bank
  bank_card_id?: string
  // Action card
  card_id?: string
  // Rent
  rent_color?: string
  double_rent_ids?: string[]
  // Targeting
  target_player_id?: string
  // Property manipulation
  steal_card_id?: string
  give_card_id?: string
  steal_color?: string
  // Wild color change
  change_wild?: { card_id: string; new_color: string }
  // Discard
  discard_ids?: string[]
}

// ─── Pending Response ─────────────────────────────────────────────────────────

export interface PendingResponseRequest {
  pending_id: string
  player_id: string
  response: 'accept' | 'just_say_no'
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface PaymentTarget {
  player_id: string
  amount: number
}

export interface PaymentRequestPayload {
  request_id: string
  receiver_id: string
  targets: PaymentTarget[]
}

export interface PaymentRequest {
  request_id: string
  payer_id: string
  receiver_id: string
  bank: string[]
  properties: string[]
  buildings: string[]
}

// ─── Action Response ──────────────────────────────────────────────────────────

export type ResponseType =
  | 'action_resolved'
  | 'payment_required'
  | 'response_required'
  | 'discard_required'
  | 'payment_applied'

export interface DiscardRequired {
  player_id: string
  required_count: number
}

export interface ResponseRequired {
  pending_requests: Array<{
    pending_id: string
    target_player: string
    prompt: string
  }>
}

export interface ActionResponse {
  status: 'ok' | 'error'
  response_type: ResponseType
  player_view?: PlayerView
  message?: string
  log?: Record<string, unknown>
  payment_request?: PaymentRequestPayload
  response_required?: ResponseRequired
  discard_required?: DiscardRequired
  game_over?: { winner_id: string }
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────

export interface WsStateUpdate {
  type: 'state_update'
  view: PlayerView
}

export interface WsPing {
  type: 'ping'
}

export type WsMessage = WsStateUpdate | WsPing
