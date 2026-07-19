import WebSocket from "ws";
import type { TraccarClient } from "./client.js";
import type { TraccarPositionPayload } from "./normalize.js";

export interface TraccarSocketMessage {
  devices: unknown[];
  positions: TraccarPositionPayload[];
  events: unknown[];
}

export interface ReconnectOptions {
  baseMs?: number;
  maxMs?: number;
  jitterRatio?: number;
  random?: () => number;
}

export interface TraccarSocketLike {
  on(event: "open" | "message" | "close" | "error", listener: (...args: any[]) => void): unknown;
  close(): void;
}

export type TraccarSocketFactory = (url: string, options: WebSocket.ClientOptions) => TraccarSocketLike;

export interface TraccarSocketClientOptions {
  baseUrl: string;
  traccarClient: Pick<TraccarClient, "getSessionCookie">;
  socketFactory?: TraccarSocketFactory;
  onMessage?: (message: TraccarSocketMessage) => void;
  onStatus?: (status: "connecting" | "open" | "closed" | "error" | "reconnecting") => void;
  reconnect?: ReconnectOptions;
}

export function buildTraccarSocketUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/socket";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function calculateReconnectDelayMs(attempt: number, options: ReconnectOptions = {}): number {
  const baseMs = options.baseMs ?? 1000;
  const maxMs = options.maxMs ?? 30000;
  const jitterRatio = options.jitterRatio ?? 0.2;
  const random = options.random ?? Math.random;
  const exponentialDelay = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = exponentialDelay * jitterRatio * random();

  return Math.min(maxMs, Math.round(exponentialDelay + jitter));
}

export function parseTraccarSocketMessage(data: WebSocket.RawData | string): TraccarSocketMessage {
  const text = rawDataToString(data);
  const parsed = JSON.parse(text) as Partial<TraccarSocketMessage>;

  return {
    devices: Array.isArray(parsed.devices) ? parsed.devices : [],
    positions: Array.isArray(parsed.positions) ? parsed.positions : [],
    events: Array.isArray(parsed.events) ? parsed.events : []
  };
}

export class TraccarSocketClient {
  private readonly socketUrl: string;
  private readonly socketFactory: TraccarSocketFactory;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private socket: TraccarSocketLike | null = null;
  private stopped = false;

  constructor(private readonly options: TraccarSocketClientOptions) {
    this.socketUrl = buildTraccarSocketUrl(options.baseUrl);
    this.socketFactory = options.socketFactory ?? ((url, socketOptions) => new WebSocket(url, socketOptions));
  }

  async connect(): Promise<void> {
    this.stopped = false;
    this.options.onStatus?.("connecting");
    
    try {
      const cookie = await this.options.traccarClient.getSessionCookie();

      this.socket = this.socketFactory(this.socketUrl, {
        headers: {
          Cookie: cookie
        }
      });

      this.socket.on("open", () => {
        this.reconnectAttempt = 0;
        this.options.onStatus?.("open");
      });

      this.socket.on("message", (data) => {
        try {
          this.options.onMessage?.(parseTraccarSocketMessage(data));
        } catch {
          this.options.onStatus?.("error");
        }
      });

      this.socket.on("error", () => {
        this.options.onStatus?.("error");
      });

      this.socket.on("close", () => {
        this.options.onStatus?.("closed");
        this.scheduleReconnect();
      });
    } catch (error) {
      this.options.onStatus?.("error");
      this.scheduleReconnect();
      throw error;
    }
  }

  close(): void {
    this.stopped = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }

    this.reconnectAttempt += 1;
    this.options.onStatus?.("reconnecting");
    const delay = calculateReconnectDelayMs(this.reconnectAttempt, this.options.reconnect);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
    this.reconnectTimer.unref();
  }
}

function rawDataToString(data: WebSocket.RawData | string): string {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }

  return Buffer.from(data).toString("utf8");
}

