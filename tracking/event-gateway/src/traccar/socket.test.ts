import { describe, expect, it, vi } from "vitest";
import type WebSocket from "ws";
import {
  buildTraccarSocketUrl,
  calculateReconnectDelayMs,
  parseTraccarSocketMessage,
  TraccarSocketClient,
  type TraccarSocketLike
} from "./socket.js";

class FakeSocket implements TraccarSocketLike {
  listeners = new Map<string, Array<(...args: any[]) => void>>();

  on(event: "open" | "message" | "close" | "error", listener: (...args: any[]) => void): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  emit(event: "open" | "message" | "close" | "error", ...args: any[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  close(): void {
    this.emit("close");
  }
}

describe("buildTraccarSocketUrl", () => {
  it("converts http Traccar URL to ws api socket URL", () => {
    expect(buildTraccarSocketUrl("http://traccar:8082")).toBe("ws://traccar:8082/api/socket");
  });

  it("converts https Traccar URL to wss api socket URL", () => {
    expect(buildTraccarSocketUrl("https://gps.example.com/base?x=1")).toBe("wss://gps.example.com/api/socket");
  });
});

describe("calculateReconnectDelayMs", () => {
  it("uses exponential backoff with bounded jitter", () => {
    const delay = calculateReconnectDelayMs(3, {
      baseMs: 1000,
      maxMs: 10000,
      jitterRatio: 0.1,
      random: () => 0.5
    });

    expect(delay).toBe(4200);
  });
});

describe("parseTraccarSocketMessage", () => {
  it("normalizes missing arrays", () => {
    const message = parseTraccarSocketMessage(
      Buffer.from(JSON.stringify({ positions: [{ deviceId: 1, latitude: -27, longitude: -48 }] }))
    );

    expect(message.devices).toEqual([]);
    expect(message.positions).toHaveLength(1);
    expect(message.events).toEqual([]);
  });
});

describe("TraccarSocketClient", () => {
  it("connects to /api/socket using the session cookie", async () => {
    const fakeSocket = new FakeSocket();
    const created: Array<{ url: string; options: WebSocket.ClientOptions }> = [];
    const onMessage = vi.fn();
    const onStatus = vi.fn();

    const client = new TraccarSocketClient({
      baseUrl: "http://traccar:8082",
      traccarClient: {
        getSessionCookie: async () => "JSESSIONID=session-1"
      },
      socketFactory: (url, options) => {
        created.push({ url, options });
        return fakeSocket;
      },
      onMessage,
      onStatus,
      reconnect: { baseMs: 1000, maxMs: 1000, jitterRatio: 0, random: () => 0 }
    });

    await client.connect();
    fakeSocket.emit("open");
    fakeSocket.emit("message", JSON.stringify({ positions: [{ deviceId: 10, latitude: -27, longitude: -48 }] }));

    expect(created[0].url).toBe("ws://traccar:8082/api/socket");
    expect(created[0].options.headers).toMatchObject({ Cookie: "JSESSIONID=session-1" });
    expect(onStatus).toHaveBeenCalledWith("open");
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [expect.objectContaining({ deviceId: 10 })]
      })
    );

    client.close();
  });
});

