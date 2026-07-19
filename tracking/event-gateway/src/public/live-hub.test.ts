import { describe, expect, it } from "vitest";
import { LiveTransportHub, type LiveSocketClient } from "./live-hub.js";
import { TrackingStateStore } from "./state.js";
import { normalizeTraccarPosition } from "../traccar/normalize.js";

class FakeSocket implements LiveSocketClient {
  readyState = 1;
  sent: string[] = [];
  private closeListeners: Array<() => void> = [];

  send(data: string): void {
    this.sent.push(data);
  }

  on(event: "close" | "error", listener: () => void): void {
    if (event === "close") {
      this.closeListeners.push(listener);
    }
  }

  emitClose(): void {
    for (const listener of this.closeListeners) {
      listener();
    }
  }
}

function makeStore() {
  const store = new TrackingStateStore();
  const vehicle = store.createVehicle({
    name: "Sao Cristovao",
    type: "main",
    traccarDeviceId: 10,
    uniqueId: "SC26-SANTO-A9F3"
  });
  store.updatePosition(
    normalizeTraccarPosition(
      {
        deviceId: 10,
        latitude: -27.236099,
        longitude: -48.644599,
        fixTime: new Date().toISOString()
      },
      vehicle.id
    )
  );

  return store;
}

describe("LiveTransportHub", () => {
  it("sends snapshot and heartbeat when a client connects", () => {
    const hub = new LiveTransportHub(makeStore(), { heartbeatIntervalMs: 25000 });
    const socket = new FakeSocket();

    hub.addClient(socket);

    expect(socket.sent).toHaveLength(2);
    expect(JSON.parse(socket.sent[0])).toMatchObject({ event: "snapshot" });
    expect(JSON.parse(socket.sent[1])).toMatchObject({ event: "heartbeat" });
    expect(socket.sent[0]).not.toContain("SC26-SANTO-A9F3");
  });

  it("broadcasts heartbeat to open clients and removes closed clients", () => {
    const hub = new LiveTransportHub(makeStore(), { heartbeatIntervalMs: 25000 });
    const openSocket = new FakeSocket();
    const closedSocket = new FakeSocket();
    closedSocket.readyState = 3;

    hub.addClient(openSocket);
    hub.addClient(closedSocket);
    hub.broadcastHeartbeat(new Date("2026-07-19T12:00:00.000Z"));

    expect(hub.clientCount).toBe(1);
    expect(openSocket.sent.at(-1)).toContain("heartbeat");
    expect(openSocket.sent.at(-1)).toContain("2026-07-19T12:00:00.000Z");
  });

  it("removes a client when close is emitted", () => {
    const hub = new LiveTransportHub(makeStore(), { heartbeatIntervalMs: 25000 });
    const socket = new FakeSocket();

    hub.addClient(socket);
    socket.emitClose();

    expect(hub.clientCount).toBe(0);
  });
});

