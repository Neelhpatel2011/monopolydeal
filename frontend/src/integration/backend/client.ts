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

export class BackendRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
  }
}

async function getResponseError(response: Response) {
  const rawDetail = await response.text();
  if (!rawDetail) {
    return `Request failed: ${response.status}`;
  }

  try {
    const parsed = JSON.parse(rawDetail) as { detail?: string };
    return parsed.detail || rawDetail;
  } catch {
    return rawDetail;
  }
}

export function isAuthSessionError(error: unknown) {
  return (
    error instanceof BackendRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

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
    throw new BackendRequestError(response.status, await getResponseError(response));
  }

  return response.json() as Promise<T>;
}

async function requestVoid(input: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new BackendRequestError(response.status, await getResponseError(response));
  }
}

function isMissingEndpointError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim();
  return (
    (error instanceof BackendRequestError &&
      (error.status === 404 || error.status === 405)) ||
    message === "Not Found" ||
    message === "Method Not Allowed" ||
    message === "Request failed: 404" ||
    message === "Request failed: 405"
  );
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
  async surrenderGame(gameId: string) {
    try {
      return await requestVoid(`/games/${gameId}/surrender`, {
        method: "POST",
      });
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      return requestVoid(`/games/${gameId}/players/me`, {
        method: "DELETE",
      });
    }
  },
  connectToGame(
    gameId: string,
    handlers: {
      onStateUpdate: (view: BackendPlayerView) => void;
      onPlayerSurrendered?: (payload: { eventId: string; playerId: string }) => void;
      onError?: (error: Event) => void;
      onClose?: (event: CloseEvent) => void;
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
        return;
      }

      if (payload.type === "player_surrendered") {
        handlers.onPlayerSurrendered?.({
          eventId: payload.event_id,
          playerId: payload.player_id,
        });
      }
    });

    socket.addEventListener("error", (event) => {
      handlers.onError?.(event);
    });
    socket.addEventListener("close", (event) => {
      handlers.onClose?.(event);
    });

    return socket;
  },
};
