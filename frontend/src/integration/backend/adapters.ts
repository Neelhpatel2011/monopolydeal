import type { BoardBlockingState } from "../../features/board/model/blocking-overlays";
import type { LocalPlayerState, LocalPropertySet } from "../../features/board/model/localPlayer";
import type {
  OpponentAvatarTone,
  OpponentDetail,
  OpponentPropertyProgress,
  OpponentPropertySet,
  OpponentSummary,
} from "../../features/opponents/model/opponentExpansion";
import type { BackendPlayerPublicView, BackendPlayerView } from "./contracts";
import {
  buildBankCardRef,
  buildHandCardRef,
  buildPropertyCardRef,
  formatBankValue,
  formatColorLabel,
  getBackendCardMeta,
  getBuildingBonus,
  getPropertySetTargetSize,
  toTableauColor,
} from "./catalog";

type BoardViewModel = {
  localPlayer: LocalPlayerState;
  opponentDetails: OpponentDetail[];
  opponentSummaries: OpponentSummary[];
  actionsLeft: number;
  discardTopCatalogCardId?: string;
  deckCount: number;
  blockingState: BoardBlockingState | null;
};

const avatarTones: OpponentAvatarTone[] = ["sky", "rose", "gold", "sage"];

function getAvatarTone(index: number): OpponentAvatarTone {
  return avatarTones[index % avatarTones.length];
}

function sumCardValues(cardIds: string[]) {
  return cardIds.reduce((total, cardId) => total + getBackendCardMeta(cardId).moneyValue, 0);
}

function sortBankCardIds(cardIds: string[]) {
  return [...cardIds].sort((left, right) => {
    const leftMeta = getBackendCardMeta(left);
    const rightMeta = getBackendCardMeta(right);

    if (rightMeta.moneyValue !== leftMeta.moneyValue) {
      return rightMeta.moneyValue - leftMeta.moneyValue;
    }

    return leftMeta.name.localeCompare(rightMeta.name);
  });
}

function sortPropertyEntries<T extends Record<string, string[]>>(properties: T) {
  return Object.entries(properties)
    .filter(([, cardIds]) => cardIds.length > 0)
    .sort(([leftColor], [rightColor]) =>
      formatColorLabel(leftColor).localeCompare(formatColorLabel(rightColor)),
    );
}

function toBuildingKinds(buildingIds: string[] | undefined): Array<"House" | "Hotel"> {
  return (buildingIds ?? [])
    .map((cardId) => getBackendCardMeta(cardId).name)
    .filter((name): name is "House" | "Hotel" => name === "House" || name === "Hotel");
}

function toPropertySet(
  playerId: string,
  color: string,
  cardIds: string[],
  buildingIds: string[] | undefined,
  summary: BackendPlayerPublicView["property_summaries"][string] | undefined,
): LocalPropertySet {
  const displayColor = toTableauColor(color);
  const targetSize = summary?.target_size ?? getPropertySetTargetSize(color);
  const name = formatColorLabel(color);
  return {
    id: `${playerId}:${color}`,
    name,
    color: displayColor,
    backendColor: color,
    count: summary?.count ?? cardIds.length,
    targetSize,
    isComplete: summary?.is_complete ?? (targetSize > 0 && cardIds.length >= targetSize),
    currentRentAmount: summary?.current_rent ?? null,
    buildingBonusAmount: summary?.building_bonus ?? 0,
    wildCount: summary?.wild_count ?? 0,
    cards: cardIds.map((cardId, index) => buildPropertyCardRef(cardId, index)),
    buildings: summary?.buildings
      ? summary.buildings.filter((name): name is "House" | "Hotel" => name === "House" || name === "Hotel")
      : toBuildingKinds(buildingIds),
    wildReassignments: summary?.wild_reassignments.map((entry) => ({
      cardId: entry.card_id,
      availableColors: entry.available_colors,
    })),
  };
}

function toOpponentPropertySet(
  playerId: string,
  color: string,
  cardIds: string[],
  buildingIds: string[] | undefined,
  summary: BackendPlayerPublicView["property_summaries"][string] | undefined,
): OpponentPropertySet {
  const localSet = toPropertySet(playerId, color, cardIds, buildingIds, summary);
  return {
    id: localSet.id,
    name: localSet.name,
    color: localSet.color as OpponentPropertySet["color"],
    backendColor: localSet.backendColor,
    count: localSet.count,
    targetSize: localSet.targetSize,
    isComplete: localSet.isComplete,
    currentRentAmount: localSet.currentRentAmount,
    buildingBonusAmount: localSet.buildingBonusAmount,
    wildCount: localSet.wildCount,
    cards: localSet.cards,
    buildings: localSet.buildings,
    wildReassignments: localSet.wildReassignments,
  };
}

function toOpponentPropertyProgress(
  playerId: string,
  color: string,
  cardIds: string[],
  summary: BackendPlayerPublicView["property_summaries"][string] | undefined,
): OpponentPropertyProgress {
  const targetSize = summary?.target_size ?? getPropertySetTargetSize(color);
  return {
    id: `${playerId}:${color}:progress`,
    color: toTableauColor(color) as OpponentPropertyProgress["color"],
    count: summary?.count ?? cardIds.length,
    targetSize,
    isComplete: summary?.is_complete ?? (targetSize > 0 && cardIds.length >= targetSize),
  };
}

function toOpponentDetail(
  player: BackendPlayerPublicView,
  index: number,
  currentPlayerId: string | null | undefined,
  winnerId: string | null | undefined,
): OpponentDetail {
  const sortedBank = sortBankCardIds(player.bank);
  const propertyEntries = sortPropertyEntries(player.properties);
  const propertySets = propertyEntries.map(([color, cardIds]) =>
    toOpponentPropertySet(
      player.id,
      color,
      cardIds,
      player.buildings[color],
      player.property_summaries[color],
    ),
  );
  const properties = propertyEntries.map(([color, cardIds]) =>
    toOpponentPropertyProgress(player.id, color, cardIds, player.property_summaries[color]),
  );

  return {
    id: player.id,
    name: player.id,
    avatarInitial: player.id.charAt(0).toUpperCase(),
    avatarTone: getAvatarTone(index),
    handCount: player.hand_count,
    bankTotal: formatBankValue(sumCardValues(sortedBank)),
    properties,
    propertySets,
    moneyCards: sortedBank.map((cardId, cardIndex) => buildBankCardRef(cardId, cardIndex)),
    isCurrentPlayer: currentPlayerId === player.id,
    isWinner: winnerId === player.id,
  };
}

function findPendingPaymentForPlayer(view: BackendPlayerView) {
  return view.payment_trackers
    .flatMap((tracker) =>
      tracker.participants
        .filter((participant) => participant.player_id === view.you.id && participant.status === "pending")
        .map((participant) => ({ tracker, participant })),
    )
    .find(Boolean);
}

function buildBlockingState(
  view: BackendPlayerView,
  discardRequired:
    | {
        discardRequestId: string;
        discardCount: number;
      }
    | null,
): BoardBlockingState | null {
  if (view.game_over?.winner_id) {
    const winnerId = view.game_over.winner_id;
    const didLocalPlayerWin = winnerId === view.you.id;

    return {
      gameOver: {
        winnerName: winnerId,
        title: didLocalPlayerWin ? "You win" : "You lose",
        detail: didLocalPlayerWin
          ? "You completed the winning board. The final board state is shown below."
          : `${winnerId} won the round. The final board state is shown below.`,
      },
    };
  }

  if (view.pending_prompts.length > 0) {
    const prompt = view.pending_prompts[0];
    return {
      pendingPrompt: {
        promptKind: prompt.prompt,
        title: prompt.prompt,
        detail: `Respond to ${prompt.source_player}'s play before the board can continue.`,
      },
    };
  }

  const pendingPayment = findPendingPaymentForPlayer(view);
  if (pendingPayment) {
    return {
      paymentRequired: {
        paymentRequestId: pendingPayment.participant.request_id ?? pendingPayment.tracker.group_id,
        amountLabel: formatBankValue(pendingPayment.participant.amount),
        payeeName: pendingPayment.tracker.receiver_id,
      },
    };
  }

  if (discardRequired) {
    return {
      discardRequired: {
        discardRequestId: discardRequired.discardRequestId,
        discardCount: discardRequired.discardCount,
      },
    };
  }

  return null;
}

export function adaptBackendPlayerViewToBoard(args: {
  view: BackendPlayerView;
  discardRequired:
    | {
        discardRequestId: string;
        discardCount: number;
      }
    | null;
}): BoardViewModel {
  const { view, discardRequired } = args;
  const winnerId = view.game_over?.winner_id ?? null;
  const sortedLocalBank = sortBankCardIds(view.you.bank);
  const localPropertyEntries = sortPropertyEntries(view.you.properties);
  const propertySets = localPropertyEntries.map(([color, cardIds]) =>
    toPropertySet(
      view.you.id,
      color,
      cardIds,
      view.you.buildings[color],
      view.you.property_summaries[color],
    ),
  );
  const localPlayer: LocalPlayerState = {
    id: view.you.id,
    name: view.you.id,
    isCurrentTurn: view.current_player_id === view.you.id,
    handCount: view.you.hand_count,
    bankTotal: formatBankValue(sumCardValues(sortedLocalBank)),
    handCards: view.you.hand.map((cardId, index) =>
      buildHandCardRef(cardId, index, view.you.available_actions[cardId]),
    ),
    propertySets,
    bankCards: sortedLocalBank.map((cardId, index) => buildBankCardRef(cardId, index)),
  };

  const opponentDetails = view.others.map((player, index) =>
    toOpponentDetail(player, index, view.current_player_id, winnerId),
  );

  return {
    localPlayer,
    opponentDetails,
    opponentSummaries: opponentDetails,
    actionsLeft: Math.max(0, 3 - view.actions_taken),
    deckCount: view.deck_count,
    discardTopCatalogCardId:
      view.discard_pile.length > 0
        ? getBackendCardMeta(view.discard_pile[view.discard_pile.length - 1]).frontendCatalogCardId
        : undefined,
    blockingState: buildBlockingState(view, discardRequired),
  };
}

export function getPendingPaymentSelectionSummary(
  view: BackendPlayerView,
  playerId: string,
) {
  const pendingPayment = view.payment_trackers
    .flatMap((tracker) =>
      tracker.participants
        .filter((participant) => participant.player_id === playerId && participant.status === "pending")
        .map((participant) => ({
          requestId: participant.request_id ?? tracker.group_id,
          receiverId: tracker.receiver_id,
          amount: participant.amount,
          groupId: tracker.group_id,
          sourcePlayerId: tracker.source_player_id,
          cardId: tracker.card_id ?? null,
        })),
    )
    .find(Boolean);

  return pendingPayment ?? null;
}

export function getPropertySetTotalBuildingBonus(set: { backendColor: string; buildings?: Array<"House" | "Hotel">; }): number {
  void set.backendColor;
  return (set.buildings ?? []).reduce((total, building) => {
    if (building === "House") {
      return total + getBuildingBonus("action_house");
    }
    if (building === "Hotel") {
      return total + getBuildingBonus("action_hotel");
    }
    return total;
  }, 0);
}
