import type { GatewayVehicle, PublicSnapshot, StoredPosition, VehicleType } from "../domain/vehicles.js";
import { createPublicSnapshot } from "../domain/vehicles.js";

interface CreateVehicleInput {
  id?: string;
  name: string;
  type: VehicleType;
  traccarDeviceId?: number;
  uniqueId?: string;
  color?: string;
  sortOrder?: number;
}

interface UpdateVehicleInput {
  name?: string;
  type?: VehicleType;
  active?: boolean;
  visible?: boolean;
  color?: string | null;
}

export interface PreparedVehicleIdentity {
  id: string;
  uniqueId: string;
  sortOrder: number;
}

export interface TrackingPersistence {
  saveVehicle(vehicle: GatewayVehicle): void;
  savePosition(position: StoredPosition): void;
}

export class TrackingStateStore {
  private vehicles = new Map<string, GatewayVehicle>();
  private positions = new Map<string, StoredPosition>();
  private nextDeviceId = 1;

  constructor(private readonly persistence?: TrackingPersistence) {}

  listVehicles(): GatewayVehicle[] {
    return [...this.vehicles.values()];
  }

  findVehicleByTraccarDeviceId(traccarDeviceId: number): GatewayVehicle | null {
    return this.listVehicles().find((vehicle) => vehicle.traccarDeviceId === traccarDeviceId) ?? null;
  }

  findVehicleById(id: string): GatewayVehicle | null {
    return this.vehicles.get(id) ?? null;
  }

  prepareVehicleIdentity(type: VehicleType): PreparedVehicleIdentity {
    const sortOrder = this.vehicles.size + 1;
    const id = this.createPublicId(type, sortOrder);

    return {
      id,
      uniqueId: this.createUniqueId(type, id),
      sortOrder
    };
  }

  createVehicle(input: CreateVehicleInput, now = new Date()): GatewayVehicle {
    const identity =
      input.id && input.uniqueId && input.sortOrder
        ? { id: input.id, uniqueId: input.uniqueId, sortOrder: input.sortOrder }
        : this.prepareVehicleIdentity(input.type);

    const vehicle: GatewayVehicle = {
      id: identity.id,
      traccarDeviceId: input.traccarDeviceId ?? this.nextDeviceId++,
      uniqueId: identity.uniqueId,
      name: input.name,
      type: input.type,
      active: true,
      visible: true,
      color: input.color,
      sortOrder: identity.sortOrder,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.vehicles.set(vehicle.id, vehicle);
    this.persistence?.saveVehicle(vehicle);
    return vehicle;
  }

  upsertVehicle(vehicle: GatewayVehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    this.persistence?.saveVehicle(vehicle);
  }

  updatePosition(position: StoredPosition): void {
    this.positions.set(position.vehicleId, position);
    this.persistence?.savePosition(position);
  }

  updateVehicle(id: string, input: UpdateVehicleInput, now = new Date()): GatewayVehicle | null {
    const current = this.findVehicleById(id);

    if (!current) {
      return null;
    }

    const updated: GatewayVehicle = {
      ...current,
      ...input,
      color: input.color === null ? undefined : input.color ?? current.color,
      updatedAt: now.toISOString()
    };

    this.vehicles.set(updated.id, updated);
    this.persistence?.saveVehicle(updated);

    return updated;
  }

  setMainVehicle(id: string, now = new Date()): GatewayVehicle | null {
    const target = this.findVehicleById(id);

    if (!target) {
      return null;
    }

    for (const vehicle of this.listVehicles()) {
      if (vehicle.id === id) {
        this.updateVehicle(vehicle.id, { type: "main" }, now);
      } else if (vehicle.type === "main") {
        this.updateVehicle(vehicle.id, { type: "truck" }, now);
      }
    }

    return this.findVehicleById(id);
  }

  hydrate(vehicles: GatewayVehicle[], positions: Map<string, StoredPosition>): void {
    this.vehicles = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    this.positions = new Map(positions);
    this.nextDeviceId = Math.max(1, ...vehicles.map((vehicle) => vehicle.traccarDeviceId + 1));
  }

  getSnapshot(now = new Date()): PublicSnapshot {
    return createPublicSnapshot(this.listVehicles(), this.positions, now);
  }

  private createPublicId(type: VehicleType, index: number): string {
    const prefix = type === "main" ? "sao-cristovao" : type === "support" ? "apoio" : "cam";
    return type === "main" ? prefix : `${prefix}-${String(index).padStart(3, "0")}`;
  }

  private createUniqueId(type: VehicleType, id: string): string {
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    const typeCode = type === "main" ? "SANTO" : type === "support" ? "APOIO" : "CAM";

    if (type === "main") {
      return `SC26-${typeCode}-${random}`;
    }

    const sequence = id.replace(/^(cam|apoio)-/i, "").toUpperCase();
    return `SC26-${typeCode}-${sequence}-${random}`;
  }
}
