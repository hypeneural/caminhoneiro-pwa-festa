import { describe, expect, it, vi } from "vitest";
import type { GatewayVehicle, StoredPosition } from "../domain/vehicles.js";
import { TrackingStateStore } from "./state.js";

describe("TrackingStateStore persistence", () => {
  it("persists created vehicles and updated positions", () => {
    const persistence = {
      saveVehicle: vi.fn(),
      savePosition: vi.fn()
    };
    const store = new TrackingStateStore(persistence);
    const vehicle = store.createVehicle({ name: "Caminhao 001", type: "truck", traccarDeviceId: 22 });
    const position: StoredPosition = {
      vehicleId: vehicle.id,
      lat: -27,
      lng: -48,
      speedKmh: 0,
      bearing: 0,
      accuracy: null,
      battery: null,
      charging: null,
      fixTime: "2026-07-19T12:00:00.000Z",
      updatedAt: "2026-07-19T12:00:00.000Z"
    };

    store.updatePosition(position);

    expect(persistence.saveVehicle).toHaveBeenCalledWith(vehicle);
    expect(persistence.savePosition).toHaveBeenCalledWith(position);
  });

  it("hydrates vehicles and positions after restart", () => {
    const vehicle: GatewayVehicle = {
      id: "cam-001",
      traccarDeviceId: 77,
      uniqueId: "SC26-CAM-001-ABCD",
      name: "Caminhao 001",
      type: "truck",
      active: true,
      visible: true,
      sortOrder: 1,
      createdAt: "2026-07-19T12:00:00.000Z",
      updatedAt: "2026-07-19T12:00:00.000Z"
    };
    const position: StoredPosition = {
      vehicleId: "cam-001",
      lat: -27,
      lng: -48,
      speedKmh: 0,
      bearing: 0,
      accuracy: null,
      battery: null,
      charging: null,
      fixTime: "2026-07-19T12:01:00.000Z",
      updatedAt: "2026-07-19T12:01:00.000Z"
    };
    const store = new TrackingStateStore();

    store.hydrate([vehicle], new Map([["cam-001", position]]));

    expect(store.listVehicles()).toEqual([vehicle]);
    expect(store.getSnapshot(new Date("2026-07-19T12:01:10.000Z")).vehicles).toHaveLength(1);
  });
});

