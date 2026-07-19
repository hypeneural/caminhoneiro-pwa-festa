import { describe, expect, it, vi } from "vitest";
import { TrackingStateStore } from "../public/state.js";
import { TrackingCoordinator } from "./coordinator.js";

describe("TrackingCoordinator", () => {
  it("updates public state from Traccar position messages and broadcasts once", () => {
    const store = new TrackingStateStore();
    const vehicle = store.createVehicle({
      name: "Sao Cristovao",
      type: "main",
      traccarDeviceId: 10,
      uniqueId: "SC26-SANTO-A9F3"
    });
    const liveHub = { broadcastSnapshot: vi.fn() };
    const coordinator = new TrackingCoordinator({
      store,
      liveHub,
      now: () => new Date("2026-07-19T12:00:05.000Z")
    });

    const updatedCount = coordinator.handleTraccarMessage({
      devices: [],
      events: [],
      positions: [
        {
          deviceId: 10,
          latitude: -27.236099,
          longitude: -48.644599,
          speed: 5,
          course: 92,
          fixTime: "2026-07-19T12:00:00.000Z",
          attributes: {
            accuracy: 7,
            batteryLevel: 88
          }
        }
      ]
    });

    const snapshot = store.getSnapshot(new Date("2026-07-19T12:00:05.000Z"));

    expect(updatedCount).toBe(1);
    expect(liveHub.broadcastSnapshot).toHaveBeenCalledTimes(1);
    expect(snapshot.vehicles).toEqual([
      expect.objectContaining({
        id: vehicle.id,
        lat: -27.236099,
        lng: -48.644599,
        speedKmh: 9.3,
        bearing: 92,
        battery: 88,
        status: "live"
      })
    ]);
  });

  it("ignores positions from unknown devices", () => {
    const store = new TrackingStateStore();
    const liveHub = { broadcastSnapshot: vi.fn() };
    const coordinator = new TrackingCoordinator({ store, liveHub });

    const updatedCount = coordinator.handleTraccarMessage({
      devices: [],
      events: [],
      positions: [{ deviceId: 999, latitude: -27, longitude: -48 }]
    });

    expect(updatedCount).toBe(0);
    expect(liveHub.broadcastSnapshot).not.toHaveBeenCalled();
    expect(store.getSnapshot().vehicles).toHaveLength(0);
  });
});

