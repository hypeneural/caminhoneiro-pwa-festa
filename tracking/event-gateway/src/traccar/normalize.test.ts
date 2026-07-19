import { describe, expect, it } from "vitest";
import { normalizeTraccarPosition } from "./normalize.js";

describe("normalizeTraccarPosition", () => {
  it("normalizes coordinates and converts knots to km/h", () => {
    const position = normalizeTraccarPosition(
      {
        deviceId: 10,
        latitude: -27.236099,
        longitude: -48.644599,
        speed: 10,
        course: 180,
        fixTime: "2026-07-19T12:00:00.000Z",
        attributes: {
          accuracy: 6,
          batteryLevel: 77,
          charge: true
        }
      },
      "sao-cristovao"
    );

    expect(position.vehicleId).toBe("sao-cristovao");
    expect(position.lat).toBe(-27.236099);
    expect(position.lng).toBe(-48.644599);
    expect(position.speedKmh).toBe(18.5);
    expect(position.bearing).toBe(180);
    expect(position.accuracy).toBe(6);
    expect(position.battery).toBe(77);
    expect(position.charging).toBe(true);
  });
});

