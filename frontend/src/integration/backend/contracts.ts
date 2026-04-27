export type BackendActionType =
  | "play_bank"
  | "play_property"
  | "change_wild"
  | "discard"
  | "end_turn"
  | "play_action_counterable"
  | "play_action_non_counterable";

export type BackendPendingResponse = "accept" | "just_say_no";

export type BackendActionRequest = {
  action_type: BackendActionType;
  card_id?: string;
  bank_card_id?: string;
  property_card_id?: string;
  property_color?: string;
  rent_color?: string;
  double_rent_ids?: string[];
  target_player_id?: string;
  steal_card_id?: string;
  give_card_id?: string;
  steal_color?: string;
  change_wild?: {
    card_id: string;
    new_color: string;
  };
  discard_ids?: string[];
};

export type BackendPaymentRequest = {
  request_id: string;
  bank: string[];
  properties: string[];
  buildings: string[];
};

export type BackendPendingResponseRequest = {
  pending_id: string;
  response: BackendPendingResponse;
};

export type BackendGameSummary = {
  game_id: string;
  game_code?: string | null;
  player_ids: string[];
  started: boolean;
};

export type BackendJoinByCodeRequest = {
  game_code: string;
  player_name: string;
};

export type BackendPendingActionPrompt = {
  pending_id: string;
  source_player: string;
  card_id: string;
  prompt: string;
  payload: Record<string, unknown>;
};

export type BackendTurnActionView = {
  player_id: string;
  action_type: string;
  card_ids: string[];
};

export type BackendPaymentParticipantView = {
  player_id: string;
  amount: number;
  status: "awaiting_response" | "pending" | "paid" | "partial" | "canceled";
  request_id?: string | null;
  paid_amount: number;
};

export type BackendPaymentTrackerView = {
  group_id: string;
  receiver_id: string;
  source_player_id: string;
  card_id?: string | null;
  participants: BackendPaymentParticipantView[];
};

export type BackendPlayerPublicView = {
  id: string;
  hand_count: number;
  bank: string[];
  properties: Record<string, string[]>;
  buildings: Record<string, string[]>;
  property_summaries: Record<string, BackendPropertySetSummaryView>;
};

export type BackendPlayerPrivateView = BackendPlayerPublicView & {
  hand: string[];
  available_actions: Record<string, BackendHandActionView>;
};

export type BackendChoiceOptionView = {
  value: string;
  label: string;
  detail?: string | null;
};

export type BackendFieldOptionsView = {
  field:
    | "property_color"
    | "rent_color"
    | "target_player_id"
    | "steal_card_id"
    | "give_card_id"
    | "steal_color";
  options: BackendChoiceOptionView[];
  by_target: Record<string, BackendChoiceOptionView[]>;
};

export type BackendHandActionView = {
  card_id: string;
  card_kind: string;
  action_type: BackendActionType;
  can_bank: boolean;
  available_double_rent_count: number;
  available_double_rent_card_id?: string | null;
  required_fields: Array<
    | "property_color"
    | "rent_color"
    | "target_player_id"
    | "steal_card_id"
    | "give_card_id"
    | "steal_color"
  >;
  chosen_defaults: Record<string, string>;
  fields: BackendFieldOptionsView[];
};

export type BackendWildReassignmentView = {
  card_id: string;
  available_colors: string[];
};

export type BackendPropertySetSummaryView = {
  color: string;
  count: number;
  target_size: number;
  is_complete: boolean;
  current_rent?: number | null;
  building_bonus: number;
  wild_count: number;
  buildings: string[];
  wild_reassignments: BackendWildReassignmentView[];
};

export type BackendPlayerView = {
  game_id: string;
  game_code?: string | null;
  host_id?: string | null;
  started: boolean;
  you: BackendPlayerPrivateView;
  others: BackendPlayerPublicView[];
  pending_prompts: BackendPendingActionPrompt[];
  turn_actions: BackendTurnActionView[];
  payment_trackers: BackendPaymentTrackerView[];
  deck_count: number;
  discard_pile: string[];
  current_player_id?: string | null;
  turn_number: number;
  actions_taken: number;
  game_over?: {
    winner_id: string;
  } | null;
};

export type BackendPaymentTarget = {
  player_id: string;
  amount: number;
};

export type BackendPaymentRequired = {
  request_id: string;
  receiver_id: string;
  targets: BackendPaymentTarget[];
  group_id?: string | null;
  source_player?: string | null;
  card_id?: string | null;
};

export type BackendResponseRequired = {
  pending_requests: Array<{
    pending_id: string;
    target_player: string;
    prompt: string;
  }>;
};

export type BackendDiscardRequired = {
  player_id: string;
  required_count: number;
};

export type BackendGameOver = {
  winner_id: string;
};

export type BackendActionResponse = {
  status: "ok" | "error";
  response_type:
    | "action_resolved"
    | "payment_required"
    | "response_required"
    | "discard_required";
  player_view?: BackendPlayerView;
  payment_request?: BackendPaymentRequired;
  response_required?: BackendResponseRequired;
  discard_required?: BackendDiscardRequired;
  game_over?: BackendGameOver;
  message?: string | null;
  log?: Record<string, unknown> | null;
};

export type BackendPaymentResponse = {
  status: "ok" | "error";
  response_type: "payment_applied";
  player_view?: BackendPlayerView;
  game_over?: BackendGameOver;
  message?: string | null;
  log?: Record<string, unknown> | null;
};

export type BackendJoinGameResponse = {
  player_id: string;
  player_view: BackendPlayerView;
};

export type BackendRealtimeMessage =
  | { type: "state_update"; view: BackendPlayerView }
  | { type: "ping" }
  | { type: "pong" };
