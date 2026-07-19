export type VehicleType = "main" | "truck" | "support";
export type VehicleStatus = "live" | "stale" | "offline";

export interface GatewayVehicle {
  id: string;
  traccarDeviceId: number;
  uniqueId: string;
  name: string;
  type: VehicleType;
  active: boolean;
  visible: boolean;
  color?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPosition {
  vehicleId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  bearing: number;
  accuracy: number | null;
  battery: number | null;
  charging: boolean | null;
  fixTime: string;
  updatedAt: string;
}

export interface PublicVehicle {
  id: string;
  name: string;
  type: VehicleType;
  lat: number;
  lng: number;
  speedKmh: number;
  bearing: number;
  accuracy: number | null;
  battery: number | null;
  updatedAt: string;
  stale: boolean;
  status: VehicleStatus;
}

export interface PublicSnapshot {
  event: "snapshot";
  serverTime: string;
  vehicles: PublicVehicle[];
}

const thresholdsByType: Record<VehicleType, { staleMs: number; offlineMs: number }> = {
  main: { staleMs: 60_000, offlineMs: 600_000 },
  truck: { staleMs: 60_000, offlineMs: 600_000 },
  support: { staleMs: 60_000, offlineMs: 600_000 }
};

export function deriveVehicleStatus(type: VehicleType, updatedAt: string, now: Date): VehicleStatus {
  const updatedAtMs = new Date(updatedAt).getTime();

  if (!Number.isFinite(updatedAtMs)) {
    return "offline";
  }

  const ageMs = Math.max(0, now.getTime() - updatedAtMs);
  const thresholds = thresholdsByType[type];

  if (ageMs >= thresholds.offlineMs) {
    return "offline";
  }

  if (ageMs >= thresholds.staleMs) {
    return "stale";
  }

  return "live";
}

export function toPublicVehicle(vehicle: GatewayVehicle, position: StoredPosition, now: Date): PublicVehicle {
  const status = deriveVehicleStatus(vehicle.type, position.updatedAt, now);

  return {
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    lat: position.lat,
    lng: position.lng,
    speedKmh: position.speedKmh,
    bearing: position.bearing,
    accuracy: position.accuracy,
    battery: position.battery,
    updatedAt: position.updatedAt,
    stale: status !== "live",
    status
  };
}

export function createPublicSnapshot(
  vehicles: GatewayVehicle[],
  positions: Map<string, StoredPosition>,
  now = new Date()
): PublicSnapshot {
  const publicVehicles = vehicles
    .filter((vehicle) => vehicle.active && vehicle.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .flatMap((vehicle) => {
      const position = positions.get(vehicle.id);
      return position ? [toPublicVehicle(vehicle, position, now)] : [];
    });

  return {
    event: "snapshot",
    serverTime: now.toISOString(),
    vehicles: publicVehicles
  };
}

