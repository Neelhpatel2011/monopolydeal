import { useEffect, useMemo, useRef, useState } from "react";
import type { BackendActionRequest, BackendPendingResponse, BackendPlayerView } from "../../../integration/backend/contracts";
import { backendClient } from "../../../integration/backend/client";
import {
  adaptBackendPlayerViewToBoard,
  getPendingPaymentSelectionSummary,
} from "../../../integration/backend/adapters";

type DiscardRequirementState = {
  discardRequestId: string;
  discardCount: number;
} | null;

type BoardSessionStatus = "bootstrapping" | "loading" | "ready" | "error";

type BoardSessionState = {
  status: BoardSessionStatus;
  gameId: string | null;
  playerId: string | null;
  view: BackendPlayerView | null;
  error: string | null;
  discardRequired: DiscardRequirementState;
};

function readSessionParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    gameId: params.get("gameId"),
    demo: params.get("demo") === "1",
  };
}

function writeSessionParams(gameId: string) {
  const params = new URLSearchParams(window.location.search);
  params.set("gameId", gameId);
  params.delete("playerId");
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

async function bootstrapBackendGame() {
  const hostName = "Player";
  const joins = ["Sam", "Emily", "Max"];
  const game = await backendClient.createGame(hostName);
  await Promise.all(joins.map((name) => backendClient.joinGame(game.game_id, name)));
  await backendClient.startGame(game.game_id);
  writeSessionParams(game.game_id);
  return { gameId: game.game_id };
}

export function useBoardSession() {
  const [state, setState] = useState<BoardSessionState>({
    status: "bootstrapping",
    gameId: null,
    playerId: null,
    view: null,
    error: null,
    discardRequired: null,
  });
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setState((current) => ({ ...current, status: "loading", error: null }));
      try {
        const sessionParams = readSessionParams();
        let { gameId } = sessionParams;
        const { demo } = sessionParams;
        if (!gameId) {
          if (!demo) {
            throw new Error("Missing game session. Open the board with gameId, or use ?demo=1 for a local demo session.");
          }
          const bootstrapped = await bootstrapBackendGame();
          gameId = bootstrapped.gameId;
        }

        const view = await backendClient.getPlayerView(gameId);
        if (cancelled) {
          return;
        }

        writeSessionParams(gameId);

        setState((current) => ({
          ...current,
          status: "ready",
          gameId,
          playerId: view.you.id,
          view,
          error: null,
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState((current) => ({
          ...current,
          status: "error",
          error: error instanceof Error ? error.message : "Board session failed to load.",
        }));
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "ready" || !state.gameId || !state.playerId) {
      return;
    }

    const gameId = state.gameId;
    let isDisposed = false;

    async function resyncView() {
      try {
        const nextView = await backendClient.getPlayerView(gameId);
        if (isDisposed) {
          return;
        }
        setState((current) => ({
          ...current,
          status: "ready",
          playerId: nextView.you.id,
          view: nextView,
          error: null,
        }));
      } catch (error) {
        if (isDisposed) {
          return;
        }
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Board session lost connection.",
        }));
      }
    }

    function connectSocket() {
      socketRef.current?.close();
      const socket = backendClient.connectToGame(gameId, {
        onStateUpdate: (view) => {
          reconnectAttemptRef.current = 0;
          setState((current) => ({
            ...current,
            playerId: view.you.id,
            view,
            discardRequired:
              current.discardRequired && view.you.hand.length <= 7 ? null : current.discardRequired,
          }));
        },
        onClose: () => {
          socketRef.current = null;
          if (isDisposed) {
            return;
          }
          const attempt = reconnectAttemptRef.current + 1;
          reconnectAttemptRef.current = attempt;
          const delay = Math.min(5000, 500 * 2 ** Math.min(attempt, 4));
          reconnectTimeoutRef.current = window.setTimeout(() => {
            void resyncView();
            connectSocket();
          }, delay);
        },
      });
      socketRef.current = socket;
    }

    connectSocket();

    return () => {
      isDisposed = true;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [state.gameId, state.playerId, state.status]);

  async function submitAction(request: BackendActionRequest) {
    if (!state.gameId) {
      throw new Error("Game not ready.");
    }

    const response = await backendClient.submitAction(state.gameId, request);
    setState((current) => ({
      ...current,
      playerId: response.player_view?.you.id ?? current.playerId,
      view: response.player_view ?? current.view,
      discardRequired:
        response.response_type === "discard_required" && response.discard_required
          ? {
              discardRequestId: `discard:${current.playerId ?? current.view?.you.id ?? "player"}:${Date.now()}`,
              discardCount: response.discard_required.required_count,
            }
          : response.status === "ok"
            ? null
            : current.discardRequired,
      error: response.status === "error" ? response.message ?? "Action failed." : null,
    }));
    return response;
  }

  async function endTurn() {
    if (!state.playerId) {
      throw new Error("Player not ready.");
    }

    return submitAction({
      action_type: "end_turn",
    });
  }

  async function startGame() {
    if (!state.gameId || !state.playerId) {
      throw new Error("Session not ready.");
    }

    await backendClient.startGame(state.gameId);
    const view = await backendClient.getPlayerView(state.gameId);
    setState((current) => ({
      ...current,
      status: "ready",
      playerId: view.you.id,
      view,
      error: null,
      discardRequired: null,
    }));
    return view;
  }

  async function submitPendingResponse(pendingId: string, response: BackendPendingResponse) {
    if (!state.gameId || !state.playerId) {
      throw new Error("Session not ready.");
    }

    const result = await backendClient.submitPendingResponse(state.gameId, pendingId, {
      pending_id: pendingId,
      response,
    });

    setState((current) => ({
      ...current,
      playerId: result.player_view?.you.id ?? current.playerId,
      view: result.player_view ?? current.view,
      error: result.status === "error" ? result.message ?? "Prompt response failed." : null,
    }));

    return result;
  }

  async function submitPayment(selection: {
    bank: string[];
    properties: string[];
    buildings: string[];
  }) {
    if (!state.gameId || !state.playerId || !state.view) {
      throw new Error("Session not ready.");
    }

    const payment = getPendingPaymentSelectionSummary(state.view, state.playerId);
    if (!payment) {
      throw new Error("No pending payment.");
    }

    const result = await backendClient.submitPayment(state.gameId, {
      request_id: payment.requestId,
      bank: selection.bank,
      properties: selection.properties,
      buildings: selection.buildings,
    });

    let refreshedView = result.player_view ?? null;
    try {
      refreshedView = await backendClient.getPlayerView(state.gameId);
    } catch {
      // Keep the response view when the immediate resync fails.
    }

    setState((current) => ({
      ...current,
      playerId: refreshedView?.you.id ?? current.playerId,
      view: refreshedView ?? current.view,
      error: result.status === "error" ? result.message ?? "Payment failed." : null,
    }));

    return result;
  }

  async function submitDiscard(cardIds: string[]) {
    if (!state.playerId) {
      throw new Error("Player not ready.");
    }
    const result = await submitAction({
      action_type: "discard",
      discard_ids: cardIds,
    });
    if (result.status === "ok") {
      setState((current) => ({ ...current, discardRequired: null }));
    }
    return result;
  }

  const boardView = useMemo(() => {
    if (!state.view) {
      return null;
    }
    return adaptBackendPlayerViewToBoard({
      view: state.view,
      discardRequired: state.discardRequired,
    });
  }, [state.discardRequired, state.view]);

  return {
    ...state,
    boardView,
    submitAction,
    endTurn,
    startGame,
    submitPendingResponse,
    submitPayment,
    submitDiscard,
  };
}
