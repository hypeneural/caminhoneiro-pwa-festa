import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AddressInfo } from "node:net";
import { buildApp } from "./app.js";
import type { AppConfig } from "./config.js";
import { TrackingStateStore } from "./public/state.js";
import { normalizeTraccarPosition } from "./traccar/normalize.js";

const config: AppConfig = {
  NODE_ENV: "test",
  PORT: 3000,
  PUBLIC_ORIGIN: "https://festadoscaminhoneiros.com.br",
  GPS_PUBLIC_URL: "https://gps.festadoscaminhoneiros.com.br",
  TRACCAR_URL: "http://traccar:8082",
  TRACCAR_EMAIL: "admin@festadoscaminhoneiros.com.br",
  TRACCAR_PASSWORD: "secret",
  ADMIN_TOKEN: "12345678901234567890123456789012",
  DATABASE_PATH: "/tmp/gateway.sqlite",
  BROADCAST_INTERVAL_MS: 1000,
  HEARTBEAT_INTERVAL_MS: 25000
};

let app: FastifyInstance | null = null;

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

async function makeApp() {
  const store = new TrackingStateStore();
  const vehicle = store.createVehicle({
    name: "Sao Cristovao",
    type: "main",
    traccarDeviceId: 10,
    uniqueId: "SC26-SANTO-A9F3"
  });
  store.updatePosition(
    normalizeTraccarPosition(
      {
        deviceId: 10,
        latitude: -27.236099,
        longitude: -48.644599,
        speed: 5,
        course: 90,
        fixTime: new Date().toISOString()
      },
      vehicle.id
    )
  );

  app = await buildApp({ config, store });
  return app;
}

describe("gateway http routes", () => {
  it("returns health status", async () => {
    const server = await makeApp();
    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
  });

  it("returns public state with no-store cache header", async () => {
    const server = await makeApp();
    const response = await server.inject({ method: "GET", url: "/public/state" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(body.event).toBe("snapshot");
    expect(body.vehicles).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("SC26-SANTO-A9F3");
  });

  it("adds explicit CORS headers to public SSE stream", async () => {
    const server = await makeApp();
    await server.listen({ port: 0, host: "127.0.0.1" });
    const address = server.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/public/stream`, {
      headers: { origin: "http://127.0.0.1:8080" }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://127.0.0.1:8080");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    await response.body?.cancel();
  });

  it("protects admin status with bearer token", async () => {
    const server = await makeApp();
    const unauthorized = await server.inject({ method: "GET", url: "/admin/status" });
    const authorized = await server.inject({
      method: "GET",
      url: "/admin/status",
      headers: { authorization: `Bearer ${config.ADMIN_TOKEN}` }
    });

    expect(unauthorized.statusCode).toBe(401);
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toMatchObject({ status: "ok" });
  });

  it("creates a local vehicle without leaking unique id", async () => {
    const server = await makeApp();
    const response = await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: { authorization: `Bearer ${config.ADMIN_TOKEN}` },
      payload: { name: "Caminhao 001", type: "truck" }
    });
    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body).toMatchObject({ name: "Caminhao 001", type: "truck" });
    expect(body.setup).toMatchObject({
      app: "Traccar Client",
      serverUrl: "https://gps.festadoscaminhoneiros.com.br"
    });
    expect(Object.keys(body)).not.toContain("uniqueId");
  });

  it("generates protected driver setup QR code", async () => {
    const server = await makeApp();
    const created = await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: { authorization: `Bearer ${config.ADMIN_TOKEN}` },
      payload: { name: "Caminhao QR", type: "truck" }
    });
    const vehicle = created.json();
    const response = await server.inject({
      method: "GET",
      url: `/admin/vehicles/${vehicle.id}/qrcode`,
      headers: { authorization: `Bearer ${config.ADMIN_TOKEN}` }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.qrText).toContain("Server URL: https://gps.festadoscaminhoneiros.com.br");
    expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
