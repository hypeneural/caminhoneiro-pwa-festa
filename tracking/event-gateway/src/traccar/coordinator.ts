import type { TrackingStateStore } from "../public/state.js";
import type { LiveTransportHub } from "../public/live-hub.js";
import { normalizeTraccarPosition } from "./normalize.js";
import type { TraccarSocketMessage } from "./socket.js";

export interface TrackingCoordinatorOptions {
  store: TrackingStateStore;
  liveHub: Pick<LiveTransportHub, "broadcastSnapshot">;
  now?: () => Date;
}

export class TrackingCoordinator {
  private readonly now: () => Date;

  constructor(private readonly options: TrackingCoordinatorOptions) {
    this.now = options.now ?? (() => new Date());
  }

  handleTraccarMessage(message: TraccarSocketMessage): number {
    let updatedCount = 0;

    for (const position of message.positions) {
      const vehicle = this.options.store.findVehicleByTraccarDeviceId(position.deviceId);

      if (!vehicle || !vehicle.active || !vehicle.visible) {
        continue;
      }

      this.options.store.updatePosition(normalizeTraccarPosition(position, vehicle.id, this.now()));
      updatedCount += 1;
    }

    if (updatedCount > 0) {
      this.options.liveHub.broadcastSnapshot();
    }

    return updatedCount;
  }
}

