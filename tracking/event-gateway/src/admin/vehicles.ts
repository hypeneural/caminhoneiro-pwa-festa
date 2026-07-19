import type { GatewayVehicle, VehicleType } from "../domain/vehicles.js";
import type { TraccarDevice } from "../traccar/client.js";
import type { TrackingStateStore } from "../public/state.js";

export interface CreateAdminVehicleInput {
  name: string;
  type: VehicleType;
  color?: string;
}

export interface TraccarDeviceCreator {
  createDevice(input: { name: string; uniqueId: string; category?: string }): Promise<TraccarDevice>;
}

export interface AdminVehicleResponse {
  id: string;
  name: string;
  type: VehicleType;
  active: boolean;
  visible: boolean;
  createdAt: string;
  setup: {
    app: "Traccar Client";
    serverUrl: string;
    deviceIdentifier: string;
  };
}

export function toAdminVehicleResponses(vehicles: GatewayVehicle[], gpsPublicUrl: string): AdminVehicleResponse[] {
  return vehicles.map((vehicle) => toAdminVehicleResponse(vehicle, gpsPublicUrl));
}

export class VehicleProvisioningService {
  constructor(
    private readonly store: TrackingStateStore,
    private readonly traccarClient?: TraccarDeviceCreator
  ) {}

  async createVehicle(input: CreateAdminVehicleInput): Promise<GatewayVehicle> {
    const identity = this.store.prepareVehicleIdentity(input.type);
    let traccarDeviceId: number | undefined;

    if (this.traccarClient) {
      const device = await this.traccarClient.createDevice({
        name: input.name,
        uniqueId: identity.uniqueId,
        category: this.toTraccarCategory(input.type)
      });

      if (typeof device.id !== "number") {
        throw new Error("Traccar did not return device id");
      }

      traccarDeviceId = device.id;
    }

    return this.store.createVehicle({
      id: identity.id,
      uniqueId: identity.uniqueId,
      sortOrder: identity.sortOrder,
      traccarDeviceId,
      name: input.name,
      type: input.type,
      color: input.color
    });
  }

  private toTraccarCategory(type: VehicleType): string {
    if (type === "main") {
      return "truck";
    }

    if (type === "support") {
      return "car";
    }

    return "truck";
  }
}

export function toAdminVehicleResponse(vehicle: GatewayVehicle, gpsPublicUrl: string): AdminVehicleResponse {
  return {
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    active: vehicle.active,
    visible: vehicle.visible,
    createdAt: vehicle.createdAt,
    setup: {
      app: "Traccar Client",
      serverUrl: gpsPublicUrl,
      deviceIdentifier: vehicle.uniqueId
    }
  };
}
