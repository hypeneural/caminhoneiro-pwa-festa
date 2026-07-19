import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_ORIGIN: z.string().url(),
  GPS_PUBLIC_URL: z.string().url(),
  TRACCAR_URL: z.string().url(),
  TRACCAR_EMAIL: z.string().email(),
  TRACCAR_PASSWORD: z.string().min(1),
  ADMIN_TOKEN: z.string().min(32),
  DATABASE_PATH: z.string().min(1).default("/app/data/gateway.sqlite"),
  BROADCAST_INTERVAL_MS: z.coerce.number().int().min(250).max(10000).default(1000),
  HEARTBEAT_INTERVAL_MS: z.coerce.number().int().min(5000).max(60000).default(25000)
});

export type AppConfig = z.infer<typeof configSchema>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.parse(env);

  return {
    ...parsed,
    PUBLIC_ORIGIN: trimTrailingSlash(parsed.PUBLIC_ORIGIN),
    GPS_PUBLIC_URL: trimTrailingSlash(parsed.GPS_PUBLIC_URL),
    TRACCAR_URL: trimTrailingSlash(parsed.TRACCAR_URL)
  };
}
