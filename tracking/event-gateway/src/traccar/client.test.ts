import { describe, expect, it } from "vitest";
import { extractSessionCookie, TraccarClient } from "./client.js";

describe("extractSessionCookie", () => {
  it("extracts JSESSIONID from set-cookie", () => {
    const headers = new Headers({
      "set-cookie": "JSESSIONID=abc123; Path=/; HttpOnly"
    });

    expect(extractSessionCookie(headers)).toBe("JSESSIONID=abc123");
  });
});

describe("TraccarClient", () => {
  it("logs in using form-urlencoded session endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: {
          "set-cookie": "JSESSIONID=session-1; Path=/; HttpOnly",
          "content-type": "application/json"
        }
      });
    };

    const client = new TraccarClient({
      baseUrl: "http://traccar:8082/",
      email: "admin@festadoscaminhoneiros.com.br",
      password: "secret",
      fetchImpl: fetchImpl as typeof fetch
    });

    await client.login();

    expect(client.cookieForTests).toBe("JSESSIONID=session-1");
    expect(calls[0].url).toBe("http://traccar:8082/api/session");
    expect(calls[0].init?.method).toBe("POST");
    expect(String(calls[0].init?.body)).toContain("email=admin%40festadoscaminhoneiros.com.br");
  });

  it("creates devices using the stored session cookie", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      if (String(url).endsWith("/api/session")) {
        return new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          headers: {
            "set-cookie": "JSESSIONID=session-2; Path=/; HttpOnly",
            "content-type": "application/json"
          }
        });
      }

      return new Response(JSON.stringify({ id: 12, name: "Caminhao 001", uniqueId: "SC26-CAM-001-K8P2" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    };

    const client = new TraccarClient({
      baseUrl: "http://traccar:8082",
      email: "admin@festadoscaminhoneiros.com.br",
      password: "secret",
      fetchImpl: fetchImpl as typeof fetch
    });

    const device = await client.createDevice({
      name: "Caminhao 001",
      uniqueId: "SC26-CAM-001-K8P2",
      category: "truck"
    });

    const createCall = calls[1];
    const headers = new Headers(createCall.init?.headers);

    expect(device.id).toBe(12);
    expect(createCall.url).toBe("http://traccar:8082/api/devices");
    expect(createCall.init?.method).toBe("POST");
    expect(headers.get("cookie")).toBe("JSESSIONID=session-2");
    expect(String(createCall.init?.body)).toContain("SC26-CAM-001-K8P2");
  });
});

