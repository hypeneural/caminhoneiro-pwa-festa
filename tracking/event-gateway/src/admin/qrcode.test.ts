import { describe, expect, it } from "vitest";
import type { GatewayVehicle } from "../domain/vehicles.js";
import { createDriverSetupInstruction, createDriverSetupQr, createDriverSetupText } from "./qrcode.js";

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

describe("driver setup QR", () => {
  it("builds clear setup instruction text", () => {
    const instruction = createDriverSetupInstruction(vehicle, "https://gps.festadoscaminhoneiros.com.br");
    const text = createDriverSetupText(vehicle, instruction);

    expect(text).toContain("Festa dos Caminhoneiros 2026");
    expect(text).toContain("Server URL: https://gps.festadoscaminhoneiros.com.br");
    expect(text).toContain("Device Identifier: SC26-CAM-001-ABCD");
  });

  it("generates a png data url", async () => {
    const response = await createDriverSetupQr(vehicle, "https://gps.festadoscaminhoneiros.com.br");

    expect(response.vehicleId).toBe("cam-001");
    expect(response.instruction.deviceIdentifier).toBe("SC26-CAM-001-ABCD");
    expect(response.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

