import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import type { AppConfig } from "../config.js";

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
  app = await buildApp({ config });
  return app;
}

const auth = { authorization: `Bearer ${config.ADMIN_TOKEN}` };

describe("admin vehicle routes", () => {
  it("lists admin vehicles with setup instructions", async () => {
    const server = await makeApp();
    await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: auth,
      payload: { name: "Caminhao Lista", type: "truck" }
    });

    const response = await server.inject({ method: "GET", url: "/admin/vehicles", headers: auth });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].setup.serverUrl).toBe("https://gps.festadoscaminhoneiros.com.br");
  });

  it("updates, disables and enables a vehicle", async () => {
    const server = await makeApp();
    const created = await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: auth,
      payload: { name: "Caminhao Editar", type: "truck" }
    });
    const vehicle = created.json();

    const updated = await server.inject({
      method: "PATCH",
      url: `/admin/vehicles/${vehicle.id}`,
      headers: auth,
      payload: { name: "Caminhao Renomeado", color: "#2563eb" }
    });
    const disabled = await server.inject({ method: "POST", url: `/admin/vehicles/${vehicle.id}/disable`, headers: auth });
    const enabled = await server.inject({ method: "POST", url: `/admin/vehicles/${vehicle.id}/enable`, headers: auth });

    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({ name: "Caminhao Renomeado" });
    expect(disabled.json()).toMatchObject({ active: false, visible: false });
    expect(enabled.json()).toMatchObject({ active: true, visible: true });
  });

  it("accepts action routes from clients that send empty form posts", async () => {
    const server = await makeApp();
    const created = await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: auth,
      payload: { name: "Caminhao Form", type: "truck" }
    });
    const vehicle = created.json();

    const response = await server.inject({
      method: "POST",
      url: `/admin/vehicles/${vehicle.id}/disable`,
      headers: {
        ...auth,
        "content-type": "application/x-www-form-urlencoded"
      },
      payload: ""
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ active: false, visible: false });
  });

  it("marks a vehicle as main", async () => {
    const server = await makeApp();
    const first = await server.inject({
      method: "POST",
      url: "/admin/vehicles",
      headers: auth,
      payload: { name: "Caminhao A", type: "truck" }
    });

    const response = await server.inject({
      method: "POST",
      url: `/admin/vehicles/${first.json().id}/main`,
      headers: auth
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ type: "main" });
  });
});
