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
const SESSION_STORAGE_PREFIX = "monopolydeal:session:";

class BackendNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendNetworkError";
  }
}

type RequestOptions = RequestInit & {
  gameId?: string;
};

function toFetchInit(init?: RequestOptions): RequestInit {
  if (!init) {
    return {};
  }

  const fetchInit: RequestOptions = { ...init };
  delete fetchInit.gameId;
  return fetchInit;
}

function isBrowserStorageAvailable(storage: Storage | undefined) {
  if (!storage) {
    return false;
  }

  try {
    const probeKey = `${SESSION_STORAGE_PREFIX}probe`;
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  if (isBrowserStorageAvailable(window.localStorage)) {
    return window.localStorage;
  }

  if (isBrowserStorageAvailable(window.sessionStorage)) {
    return window.sessionStorage;
  }

  return null;
}

function sessionTokenKey(gameId: string) {
  return `${SESSION_STORAGE_PREFIX}${gameId}`;
}

function saveGameSessionToken(gameId: string | null | undefined, token: string | null | undefined) {
  if (!gameId || !token) {
    return;
  }

  getSessionStorage()?.setItem(sessionTokenKey(gameId), token);
}

function readGameSessionToken(gameId: string | null | undefined) {
  if (!gameId) {
    return null;
  }

  return getSessionStorage()?.getItem(sessionTokenKey(gameId)) ?? null;
}

function clearGameSessionToken(gameId: string | null | undefined) {
  if (!gameId) {
    return;
  }

  getSessionStorage()?.removeItem(sessionTokenKey(gameId));
}

function getRequestHeaders(init?: RequestOptions) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = readGameSessionToken(init?.gameId);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function getFetchFailureMessage(error: unknown) {
  if (error instanceof BackendNetworkError || error instanceof BackendRequestError) {
    return error.message;
  }

  const configuredBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim();
  const configHint = configuredBaseUrl
    ? "Check that the backend is awake and allows this frontend origin."
    : "Set VITE_BACKEND_URL to the deployed backend URL for hosted builds.";
  const details = error instanceof Error && error.message ? ` (${error.message})` : "";
  return `Could not reach the game server at ${API_BASE_URL}. ${configHint}${details}`;
}

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

async function requestJson<T>(input: string, init?: RequestOptions): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${input}`, {
      ...toFetchInit(init),
      credentials: "include",
      headers: getRequestHeaders(init),
    });

    if (!response.ok) {
      throw new BackendRequestError(response.status, await getResponseError(response));
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof BackendRequestError) {
      throw error;
    }

    throw new BackendNetworkError(getFetchFailureMessage(error));
  }
}

async function requestVoid(input: string, init?: RequestOptions): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}${input}`, {
      ...toFetchInit(init),
      credentials: "include",
      headers: getRequestHeaders(init),
    });

    if (!response.ok) {
      throw new BackendRequestError(response.status, await getResponseError(response));
    }
  } catch (error) {
    if (error instanceof BackendRequestError) {
      throw error;
    }

    throw new BackendNetworkError(getFetchFailureMessage(error));
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
    const game = await requestJson<BackendGameSummary>("/games", {
      method: "POST",
      body: JSON.stringify({ player_name: playerName }),
    });
    saveGameSessionToken(game.game_id, game.access_token);
    return game;
  },
  async joinGame(gameId: string, playerName: string) {
    return requestJson<BackendJoinGameResponse>(`/games/${gameId}/players/${encodeURIComponent(playerName)}`, {
      method: "POST",
    });
  },
  async joinGameByCode(request: BackendJoinByCodeRequest) {
    const response = await requestJson<BackendJoinGameResponse>("/games/join", {
      method: "POST",
      body: JSON.stringify(request),
    });
    saveGameSessionToken(response.player_view.game_id, response.access_token);
    return response;
  },
  async getGameState(gameId: string) {
    return requestJson<BackendGameSummary>(`/games/${gameId}/state`, { gameId });
  },
  async startGame(gameId: string) {
    return requestJson<BackendGameSummary>(`/games/${gameId}/start`, {
      method: "POST",
      gameId,
    });
  },
  async getPlayerView(gameId: string) {
    return requestJson<BackendPlayerView>(`/games/${gameId}/view`, { gameId });
  },
  async submitAction(gameId: string, request: BackendActionRequest) {
    return requestJson<BackendActionResponse>(`/games/${gameId}/actions`, {
      method: "POST",
      gameId,
      body: JSON.stringify(request),
    });
  },
  async submitPendingResponse(gameId: string, pendingId: string, request: BackendPendingResponseRequest) {
    return requestJson<BackendActionResponse>(
      `/games/${gameId}/pending/${pendingId}/respond`,
      {
        method: "POST",
        gameId,
        body: JSON.stringify(request),
      },
    );
  },
  async submitPayment(gameId: string, request: BackendPaymentRequest) {
    return requestJson<BackendPaymentResponse>(`/games/${gameId}/payments`, {
      method: "POST",
      gameId,
      body: JSON.stringify(request),
    });
  },
  async surrenderGame(gameId: string) {
    try {
      await requestVoid(`/games/${gameId}/surrender`, {
        method: "POST",
        gameId,
      });
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      await requestVoid(`/games/${gameId}/players/me`, {
        method: "DELETE",
        gameId,
      });
    }

    clearGameSessionToken(gameId);
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
    const socketUrl = new URL(`${WS_BASE_URL}/ws/games/${gameId}`);
    const token = readGameSessionToken(gameId);
    if (token) {
      socketUrl.searchParams.set("session_token", token);
    }
    const socket = new WebSocket(socketUrl);

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
