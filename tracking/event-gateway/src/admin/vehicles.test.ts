import { describe, expect, it, vi } from "vitest";
import { TrackingStateStore } from "../public/state.js";
import { toAdminVehicleResponse, VehicleProvisioningService } from "./vehicles.js";

describe("VehicleProvisioningService", () => {
  it("creates a Traccar device before storing a local vehicle", async () => {
    const store = new TrackingStateStore();
    const createDevice = vi.fn(async (input: { name: string; uniqueId: string; category?: string }) => ({
      id: 77,
      ...input
    }));
    const service = new VehicleProvisioningService(store, { createDevice });

    const vehicle = await service.createVehicle({ name: "Caminhao 001", type: "truck" });

    expect(createDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Caminhao 001",
        category: "truck"
      })
    );
    expect(vehicle.traccarDeviceId).toBe(77);
    expect(vehicle.uniqueId).toMatch(/^SC26-CAM-001-/);
    expect(store.listVehicles()).toHaveLength(1);
  });

  it("returns protected setup instructions without top-level operational fields", async () => {
    const store = new TrackingStateStore();
    const service = new VehicleProvisioningService(store);
    const vehicle = await service.createVehicle({ name: "Apoio 001", type: "support" });
    const response = toAdminVehicleResponse(vehicle, "https://gps.festadoscaminhoneiros.com.br");

    expect(response).toMatchObject({ name: "Apoio 001", type: "support" });
    expect(response.setup).toEqual({
      app: "Traccar Client",
      serverUrl: "https://gps.festadoscaminhoneiros.com.br",
      deviceIdentifier: vehicle.uniqueId
    });
    expect(Object.keys(response)).not.toContain("uniqueId");
    expect(Object.keys(response)).not.toContain("traccarDeviceId");
  });
});
