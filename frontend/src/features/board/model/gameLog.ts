import type { BackendGameLogEntryView } from "../../../integration/backend/contracts";
import { getBackendCardMeta } from "../../../integration/backend/catalog";

function formatActionVerb(actionType: string) {
  switch (actionType) {
    case "play_bank":
      return "banked";
    case "play_property":
      return "played to tableau";
    case "change_wild":
      return "moved wild";
    case "discard":
      return "discarded";
    case "just_say_no":
      return "played";
    case "play_action_counterable":
    case "play_action_non_counterable":
      return "played";
    default:
      return "played";
  }
}

function formatCardNames(cardIds: string[]) {
  if (cardIds.length === 0) {
    return "a card";
  }

  return cardIds.map((cardId) => getBackendCardMeta(cardId).name).join(" + ");
}

export function formatGameLogLine(entry: BackendGameLogEntryView, localPlayerId: string) {
  const playerName = entry.player_id === localPlayerId ? "You" : entry.player_id;
  return `${playerName} ${formatActionVerb(entry.action_type)} ${formatCardNames(entry.card_ids)}`;
}
