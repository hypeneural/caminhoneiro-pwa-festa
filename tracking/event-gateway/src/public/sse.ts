import type { LiveMessage } from "./messages.js";
import { serializeLiveMessage } from "./messages.js";

export function formatSseEvent(event: LiveMessage["event"], data: LiveMessage): string {
  return `event: ${event}\ndata: ${serializeLiveMessage(data)}\n\n`;
}

