import type { PublicSnapshot } from "../domain/vehicles.js";

export interface HeartbeatMessage {
  event: "heartbeat";
  serverTime: string;
}

export type LiveMessage = PublicSnapshot | HeartbeatMessage;

export function createHeartbeat(now = new Date()): HeartbeatMessage {
  return {
    event: "heartbeat",
    serverTime: now.toISOString()
  };
}

export function serializeLiveMessage(message: LiveMessage): string {
  return JSON.stringify(message);
}

