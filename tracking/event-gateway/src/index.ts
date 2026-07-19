import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { SqliteGatewayRepository } from "./db/sqlite-repository.js";
import { LiveTransportHub } from "./public/live-hub.js";
import { TrackingStateStore } from "./public/state.js";
import { TraccarClient } from "./traccar/client.js";
import { TrackingCoordinator } from "./traccar/coordinator.js";
import { TraccarSocketClient } from "./traccar/socket.js";

const config = loadConfig();
const repository = new SqliteGatewayRepository(config.DATABASE_PATH);
repository.init();
const store = new TrackingStateStore(repository);
store.hydrate(repository.loadVehicles(), repository.loadPositions());
const liveHub = new LiveTransportHub(store, { heartbeatIntervalMs: config.HEARTBEAT_INTERVAL_MS });
const traccarClient = new TraccarClient({
  baseUrl: config.TRACCAR_URL,
  email: config.TRACCAR_EMAIL,
  password: config.TRACCAR_PASSWORD
});
const app = await buildApp({ config, store, hub: liveHub, traccarClient });

app.addHook("onClose", async () => {
  repository.close();
});
const coordinator = new TrackingCoordinator({ store, liveHub });
const traccarSocket = new TraccarSocketClient({
  baseUrl: config.TRACCAR_URL,
  traccarClient,
  onMessage: (message) => coordinator.handleTraccarMessage(message),
  onStatus: (status) => app.log.info({ status }, "traccar socket status")
});

try {
  await app.listen({ host: "0.0.0.0", port: config.PORT });
  traccarSocket.connect().catch((error) => {
    app.log.warn({ error }, "traccar socket initial connection failed");
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
