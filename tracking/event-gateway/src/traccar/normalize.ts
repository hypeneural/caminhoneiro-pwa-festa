import type { StoredPosition } from "../domain/vehicles.js";

interface TraccarAttributes {
  accuracy?: number;
  batteryLevel?: number;
  battery?: number;
  charge?: boolean;
}

export interface TraccarPositionPayload {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  accuracy?: number;
  fixTime?: string;
  deviceTime?: string;
  serverTime?: string;
  attributes?: TraccarAttributes;
}

const knotsToKmh = (speedKnots: number) => Math.round(speedKnots * 1.852 * 10) / 10;

export function normalizeTraccarPosition(
  payload: TraccarPositionPayload,
  vehicleId: string,
  now = new Date()
): StoredPosition {
  const accuracy = payload.accuracy ?? payload.attributes?.accuracy ?? null;
  const battery = payload.attributes?.batteryLevel ?? payload.attributes?.battery ?? null;
  const updatedAt = payload.fixTime ?? payload.deviceTime ?? payload.serverTime ?? now.toISOString();

  return {
    vehicleId,
    lat: payload.latitude,
    lng: payload.longitude,
    speedKmh: knotsToKmh(payload.speed ?? 0),
    bearing: payload.course ?? 0,
    accuracy: typeof accuracy === "number" ? accuracy : null,
    battery: typeof battery === "number" ? battery : null,
    charging: typeof payload.attributes?.charge === "boolean" ? payload.attributes.charge : null,
    fixTime: updatedAt,
    updatedAt
  };
}

