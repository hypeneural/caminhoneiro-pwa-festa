import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const validEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  PUBLIC_ORIGIN: "https://festadoscaminhoneiros.com.br/",
  GPS_PUBLIC_URL: "https://gps.festadoscaminhoneiros.com.br/",
  TRACCAR_URL: "http://traccar:8082/",
  TRACCAR_EMAIL: "admin@festadoscaminhoneiros.com.br",
  TRACCAR_PASSWORD: "secret",
  ADMIN_TOKEN: "12345678901234567890123456789012",
  DATABASE_PATH: "/tmp/gateway.sqlite"
};

describe("loadConfig", () => {
  it("accepts valid env and trims URL trailing slashes", () => {
    const config = loadConfig(validEnv);

    expect(config.PUBLIC_ORIGIN).toBe("https://festadoscaminhoneiros.com.br");
    expect(config.GPS_PUBLIC_URL).toBe("https://gps.festadoscaminhoneiros.com.br");
    expect(config.TRACCAR_URL).toBe("http://traccar:8082");
    expect(config.PORT).toBe(3000);
  });

  it("rejects weak admin token", () => {
    expect(() => loadConfig({ ...validEnv, ADMIN_TOKEN: "short" })).toThrow();
  });

  it("rejects invalid public origin", () => {
    expect(() => loadConfig({ ...validEnv, PUBLIC_ORIGIN: "festadoscaminhoneiros" })).toThrow();
  });
});
