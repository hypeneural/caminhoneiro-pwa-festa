import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import { requireAdminToken } from "./admin/auth.js";
import { TrackingStateStore } from "./public/state.js";
import { formatSseEvent } from "./public/sse.js";
import { createHeartbeat } from "./public/messages.js";
import { LiveTransportHub } from "./public/live-hub.js";
import {
  toAdminVehicleResponse,
  toAdminVehicleResponses,
  VehicleProvisioningService,
  type TraccarDeviceCreator
} from "./admin/vehicles.js";
import { createDriverSetupQr } from "./admin/qrcode.js";

const createVehicleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["main", "truck", "support"]).default("truck"),
  color: z.string().trim().max(24).optional()
});

const updateVehicleSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  type: z.enum(["main", "truck", "support"]).optional(),
  color: z.string().trim().max(24).nullable().optional(),
  visible: z.boolean().optional(),
  active: z.boolean().optional()
});

export interface BuildAppOptions {
  config: AppConfig;
  store?: TrackingStateStore;
  hub?: LiveTransportHub;
  traccarClient?: TraccarDeviceCreator;
  vehicleProvisioner?: VehicleProvisioningService;
}

export async function buildApp({
  config,
  store = new TrackingStateStore(),
  hub,
  traccarClient,
  vehicleProvisioner
}: BuildAppOptions) {
  const app = Fastify({
    logger: config.NODE_ENV !== "test"
  });
  const liveHub = hub ?? new LiveTransportHub(store, { heartbeatIntervalMs: config.HEARTBEAT_INTERVAL_MS });
  const vehicles = vehicleProvisioner ?? new VehicleProvisioningService(store, traccarClient);

  app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_request, body, done) => {
    const params = new URLSearchParams(body.toString());
    done(null, Object.fromEntries(params.entries()));
  });

  await app.register(cors, {
    origin: [config.PUBLIC_ORIGIN, "http://localhost:8080", "http://127.0.0.1:8080", "https://festadoscaminhoneiros.com.br", "https://www.festadoscaminhoneiros.com.br"],
    credentials: false
  });

  await app.register(rateLimit, {
    max: 240,
    timeWindow: "1 minute"
  });

  await app.register(websocket);
  liveHub.start();

  app.addHook("onClose", async () => {
    liveHub.stop();
  });

  app.get("/health", async () => ({
    status: "ok",
    time: new Date().toISOString()
  }));

  app.get("/public/state", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return store.getSnapshot();
  });

  app.get("/public/vehicles", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return store.getSnapshot().vehicles;
  });

  app.get("/public/stream", async (request, reply) => {
    const allowedOrigins = new Set([config.PUBLIC_ORIGIN, "http://localhost:8080", "http://127.0.0.1:8080", "https://festadoscaminhoneiros.com.br", "https://www.festadoscaminhoneiros.com.br"]);
    const requestOrigin = request.headers.origin;
    const corsOrigin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : config.PUBLIC_ORIGIN;

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": corsOrigin,
      Vary: "Origin",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive"
    });

    reply.raw.write(formatSseEvent("snapshot", store.getSnapshot()));
    reply.raw.write(formatSseEvent("heartbeat", createHeartbeat()));

    const heartbeatTimer = setInterval(() => {
      reply.raw.write(formatSseEvent("heartbeat", createHeartbeat()));
    }, config.HEARTBEAT_INTERVAL_MS);
    heartbeatTimer.unref();

    request.raw.on("close", () => {
      clearInterval(heartbeatTimer);
    });
  });

  app.get("/ws", { websocket: true }, (socket) => {
    liveHub.addClient(socket);
  });

  app.get(
    "/admin/status",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async () => ({
      status: "ok",
      vehicleCount: store.listVehicles().length,
      time: new Date().toISOString()
    })
  );

  app.get(
    "/admin/vehicles",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async () => toAdminVehicleResponses(store.listVehicles(), config.GPS_PUBLIC_URL)
  );

  app.post(
    "/admin/vehicles",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async (request, reply) => {
      const input = createVehicleSchema.parse(request.body);
      const vehicle = await vehicles.createVehicle(input);

      return reply.code(201).send(toAdminVehicleResponse(vehicle, config.GPS_PUBLIC_URL));
    }
  );

  app.patch(
    "/admin/vehicles/:id",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const input = updateVehicleSchema.parse(request.body);
      const vehicle = store.updateVehicle(params.id, input);

      if (!vehicle) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      return toAdminVehicleResponse(vehicle, config.GPS_PUBLIC_URL);
    }
  );

  app.post(
    "/admin/vehicles/:id/disable",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const vehicle = store.updateVehicle(params.id, { active: false, visible: false });

      if (!vehicle) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      return toAdminVehicleResponse(vehicle, config.GPS_PUBLIC_URL);
    }
  );

  app.post(
    "/admin/vehicles/:id/enable",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const vehicle = store.updateVehicle(params.id, { active: true, visible: true });

      if (!vehicle) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      return toAdminVehicleResponse(vehicle, config.GPS_PUBLIC_URL);
    }
  );

  app.post(
    "/admin/vehicles/:id/main",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const vehicle = store.setMainVehicle(params.id);

      if (!vehicle) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      return toAdminVehicleResponse(vehicle, config.GPS_PUBLIC_URL);
    }
  );

  const getVehicleQrCode = async (request: FastifyRequest, reply: FastifyReply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const vehicle = store.findVehicleById(params.id);

      if (!vehicle) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      return createDriverSetupQr(vehicle, config.GPS_PUBLIC_URL);
  };

  app.get(
    "/admin/vehicles/:id/qrcode",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    getVehicleQrCode
  );

  app.post(
    "/admin/vehicles/:id/qrcode",
    { preHandler: requireAdminToken(config.ADMIN_TOKEN) },
    getVehicleQrCode
  );

  return app;
}
