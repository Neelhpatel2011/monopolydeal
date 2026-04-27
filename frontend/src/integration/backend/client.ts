import type {
  BackendActionRequest,
  BackendActionResponse,
  BackendGameSummary,
  BackendJoinByCodeRequest,
  BackendJoinGameResponse,
  BackendPaymentRequest,
  BackendPaymentResponse,
  BackendPendingResponseRequest,
  BackendPlayerView,
  BackendRealtimeMessage,
} from "./contracts";

function resolveApiBaseUrl() {
  const configuredBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "");
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const normalizedProtocol = protocol === "https:" ? "https:" : "http:";
    return `${normalizedProtocol}//${hostname}:8000`;
  }

  return "http://127.0.0.1:8000";
}

const API_BASE_URL = resolveApiBaseUrl();
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const rawDetail = await response.text();
    if (rawDetail) {
      let detailMessage = rawDetail;
      try {
        const parsed = JSON.parse(rawDetail) as { detail?: string };
        detailMessage = parsed.detail || rawDetail;
      } catch {
        // Keep the raw response body when the server did not return JSON.
      }
      throw new Error(detailMessage);
    }
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const backendClient = {
  async createGame(playerName: string) {
    return requestJson<BackendGameSummary>("/games", {
      method: "POST",
      body: JSON.stringify({ player_name: playerName }),
    });
  },
  async joinGame(gameId: string, playerName: string) {
    return requestJson<BackendJoinGameResponse>(`/games/${gameId}/players/${encodeURIComponent(playerName)}`, {
      method: "POST",
    });
  },
  async joinGameByCode(request: BackendJoinByCodeRequest) {
    return requestJson<BackendJoinGameResponse>("/games/join", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  async getGameState(gameId: string) {
    return requestJson<BackendGameSummary>(`/games/${gameId}/state`);
  },
  async startGame(gameId: string) {
    return requestJson<BackendGameSummary>(`/games/${gameId}/start`, {
      method: "POST",
    });
  },
  async getPlayerView(gameId: string) {
    return requestJson<BackendPlayerView>(`/games/${gameId}/view`);
  },
  async submitAction(gameId: string, request: BackendActionRequest) {
    return requestJson<BackendActionResponse>(`/games/${gameId}/actions`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  async submitPendingResponse(gameId: string, pendingId: string, request: BackendPendingResponseRequest) {
    return requestJson<BackendActionResponse>(
      `/games/${gameId}/pending/${pendingId}/respond`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  },
  async submitPayment(gameId: string, request: BackendPaymentRequest) {
    return requestJson<BackendPaymentResponse>(`/games/${gameId}/payments`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  connectToGame(
    gameId: string,
    handlers: {
      onStateUpdate: (view: BackendPlayerView) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
    },
  ) {
    const socket = new WebSocket(`${WS_BASE_URL}/ws/games/${gameId}`);

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        return;
      }

      if (event.data === "pong") {
        return;
      }

      const payload = JSON.parse(event.data) as BackendRealtimeMessage;
      if (payload.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }

      if (payload.type === "state_update") {
        handlers.onStateUpdate(payload.view);
      }
    });

    socket.addEventListener("error", (event) => {
      handlers.onError?.(event);
    });
    socket.addEventListener("close", () => {
      handlers.onClose?.();
    });

    return socket;
  },
};
