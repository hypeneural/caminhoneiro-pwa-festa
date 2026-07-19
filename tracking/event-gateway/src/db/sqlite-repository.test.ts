import { describe, expect, it } from "vitest";
import { SqliteGatewayRepository } from "./sqlite-repository.js";
import type { GatewayVehicle, StoredPosition } from "../domain/vehicles.js";

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
  lat: -27.236099,
  lng: -48.644599,
  speedKmh: 18.5,
  bearing: 92,
  accuracy: 7,
  battery: 88,
  charging: true,
  fixTime: "2026-07-19T12:01:00.000Z",
  updatedAt: "2026-07-19T12:01:00.000Z"
};

describe("SqliteGatewayRepository", () => {
  it("saves and loads vehicles", () => {
    const repository = new SqliteGatewayRepository(":memory:");
    repository.init();

    repository.saveVehicle(vehicle);

    expect(repository.loadVehicles()).toEqual([vehicle]);
    repository.close();
  });

  it("saves and loads last positions", () => {
    const repository = new SqliteGatewayRepository(":memory:");
    repository.init();

    repository.savePosition(position);

    expect(repository.loadPositions().get("cam-001")).toEqual(position);
    repository.close();
  });

  it("updates existing vehicle and position records", () => {
    const repository = new SqliteGatewayRepository(":memory:");
    repository.init();

    repository.saveVehicle(vehicle);
    repository.saveVehicle({ ...vehicle, name: "Caminhao Atualizado", updatedAt: "2026-07-19T12:02:00.000Z" });
    repository.savePosition(position);
    repository.savePosition({ ...position, speedKmh: 0, updatedAt: "2026-07-19T12:02:00.000Z" });

    expect(repository.loadVehicles()).toHaveLength(1);
    expect(repository.loadVehicles()[0].name).toBe("Caminhao Atualizado");
    expect(repository.loadPositions().get("cam-001")).toMatchObject({ speedKmh: 0 });
    repository.close();
  });
});

