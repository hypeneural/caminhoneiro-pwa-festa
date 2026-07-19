import type { TrackingStateStore } from "./state.js";
import { createHeartbeat, serializeLiveMessage } from "./messages.js";

const OPEN_READY_STATE = 1;

export interface LiveSocketClient {
  readyState?: number;
  send(data: string): void;
  close?: () => void;
  on?: (event: "close" | "error", listener: () => void) => void;
}

export interface LiveTransportHubOptions {
  heartbeatIntervalMs: number;
}

export class LiveTransportHub {
  private readonly clients = new Set<LiveSocketClient>();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly store: TrackingStateStore,
    private readonly options: LiveTransportHubOptions
  ) {}

  get clientCount() {
    return this.clients.size;
  }

  addClient(client: LiveSocketClient): void {
    this.clients.add(client);
    client.on?.("close", () => this.clients.delete(client));
    client.on?.("error", () => this.clients.delete(client));
    this.send(client, serializeLiveMessage(this.store.getSnapshot()));
    this.send(client, serializeLiveMessage(createHeartbeat()));
  }

  broadcastSnapshot(): void {
    this.broadcast(serializeLiveMessage(this.store.getSnapshot()));
  }

  broadcastHeartbeat(now = new Date()): void {
    this.broadcast(serializeLiveMessage(createHeartbeat(now)));
  }

  start(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => this.broadcastHeartbeat(), this.options.heartbeatIntervalMs);
    this.heartbeatTimer.unref();
  }

  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const client of this.clients) {
      client.close?.();
    }

    this.clients.clear();
  }

  private broadcast(data: string): void {
    for (const client of this.clients) {
      if (!this.isOpen(client)) {
        this.clients.delete(client);
        continue;
      }

      this.send(client, data);
    }
  }

  private send(client: LiveSocketClient, data: string): void {
    if (!this.isOpen(client)) {
      this.clients.delete(client);
      return;
    }

    client.send(data);
  }

  private isOpen(client: LiveSocketClient): boolean {
    return client.readyState === undefined || client.readyState === OPEN_READY_STATE;
  }
}

