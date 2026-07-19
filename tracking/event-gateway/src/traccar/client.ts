export interface TraccarDevice {
  id?: number;
  name: string;
  uniqueId: string;
  category?: string;
}

export interface CreateTraccarDeviceInput {
  name: string;
  uniqueId: string;
  category?: string;
}

export interface TraccarClientOptions {
  baseUrl: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
}

export class TraccarClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly fetchImpl: typeof fetch;
  private sessionCookie: string | null = null;

  constructor(options: TraccarClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.email = options.email;
    this.password = options.password;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  get hasSession() {
    return this.sessionCookie !== null;
  }

  get cookieForTests() {
    return this.sessionCookie;
  }

  async getSessionCookie(): Promise<string> {
    return this.ensureSessionCookie();
  }

  async login(): Promise<void> {
    const body = new URLSearchParams({
      email: this.email,
      password: this.password
    });

    const response = await this.fetchImpl(`${this.baseUrl}/api/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Traccar login failed: ${response.status}`);
    }

    const cookie = extractSessionCookie(response.headers);

    if (!cookie) {
      throw new Error("Traccar login did not return a session cookie");
    }

    this.sessionCookie = cookie;
  }

  async getDevices(): Promise<TraccarDevice[]> {
    const response = await this.authenticatedFetch("/api/devices");
    return response.json() as Promise<TraccarDevice[]>;
  }

  async createDevice(input: CreateTraccarDeviceInput): Promise<TraccarDevice> {
    const response = await this.authenticatedFetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    return response.json() as Promise<TraccarDevice>;
  }

  async getPositions(): Promise<unknown[]> {
    const response = await this.authenticatedFetch("/api/positions");
    return response.json() as Promise<unknown[]>;
  }

  private async authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    let sessionCookie = await this.ensureSessionCookie();
    const headers = new Headers(init.headers);
    headers.set("Cookie", sessionCookie);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    if (response.status === 401) {
      this.sessionCookie = null;
      sessionCookie = await this.ensureSessionCookie();
      headers.set("Cookie", sessionCookie);

      return this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers
      });
    }

    if (!response.ok) {
      throw new Error(`Traccar request failed: ${path} ${response.status}`);
    }

    return response;
  }

  private async ensureSessionCookie(): Promise<string> {
    if (!this.sessionCookie) {
      await this.login();
    }

    if (!this.sessionCookie) {
      throw new Error("Traccar session cookie is not available");
    }

    return this.sessionCookie;
  }
}

export function extractSessionCookie(headers: Headers): string | null {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = withGetSetCookie.getSetCookie?.() ?? splitCombinedSetCookie(headers.get("set-cookie"));
  const sessionCookie = cookies.find((cookie) => cookie.toLowerCase().startsWith("jsessionid="));

  return sessionCookie?.split(";")[0] ?? null;
}

function splitCombinedSetCookie(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[A-Za-z0-9_!#$%&'*+.^`|~-]+=)/).map((cookie) => cookie.trim());
}
