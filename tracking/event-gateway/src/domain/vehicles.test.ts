import { describe, expect, it } from "vitest";
import type { GatewayVehicle, StoredPosition } from "./vehicles.js";
import { createPublicSnapshot } from "./vehicles.js";

const baseVehicle: GatewayVehicle = {
  id: "sao-cristovao",
  traccarDeviceId: 12,
  uniqueId: "SC26-SANTO-A9F3",
  name: "Sao Cristovao",
  type: "main",
  active: true,
  visible: true,
  sortOrder: 1,
  createdAt: "2026-07-19T10:00:00.000Z",
  updatedAt: "2026-07-19T10:00:00.000Z"
};

const position: StoredPosition = {
  vehicleId: "sao-cristovao",
  lat: -27.236099,
  lng: -48.644599,
  speedKmh: 12,
  bearing: 90,
  accuracy: 8,
  battery: 82,
  charging: true,
  fixTime: "2026-07-19T12:00:00.000Z",
  updatedAt: "2026-07-19T12:00:00.000Z"
};

describe("createPublicSnapshot", () => {
  it("does not expose operational identifiers", () => {
    const snapshot = createPublicSnapshot(
      [baseVehicle],
      new Map([[position.vehicleId, position]]),
      new Date("2026-07-19T12:00:10.000Z")
    );

    expect(snapshot.vehicles).toHaveLength(1);
    expect(JSON.stringify(snapshot)).not.toContain("uniqueId");
    expect(JSON.stringify(snapshot)).not.toContain("traccarDeviceId");
    expect(snapshot.vehicles[0].status).toBe("live");
  });

  it("marks main vehicle as stale after 20 seconds", () => {
    const snapshot = createPublicSnapshot(
      [baseVehicle],
      new Map([[position.vehicleId, position]]),
      new Date("2026-07-19T12:00:20.000Z")
    );

    expect(snapshot.vehicles[0].status).toBe("stale");
    expect(snapshot.vehicles[0].stale).toBe(true);
  });

  it("uses longer stale threshold for regular trucks", () => {
    const truck = { ...baseVehicle, id: "cam-001", type: "truck" as const, sortOrder: 2 };
    const truckPosition = { ...position, vehicleId: "cam-001" };
    const snapshot = createPublicSnapshot(
      [truck],
      new Map([[truckPosition.vehicleId, truckPosition]]),
      new Date("2026-07-19T12:00:40.000Z")
    );

    expect(snapshot.vehicles[0].status).toBe("live");
  });

  it("filters invisible and inactive vehicles", () => {
    const invisible = { ...baseVehicle, id: "cam-002", visible: false };
    const inactive = { ...baseVehicle, id: "cam-003", active: false };
    const snapshot = createPublicSnapshot(
      [invisible, inactive],
      new Map([
        ["cam-002", { ...position, vehicleId: "cam-002" }],
        ["cam-003", { ...position, vehicleId: "cam-003" }]
      ]),
      new Date("2026-07-19T12:00:10.000Z")
    );

    expect(snapshot.vehicles).toHaveLength(0);
  });
});

