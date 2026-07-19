import { describe, expect, it } from "vitest";
import { createHeartbeat } from "./messages.js";
import { formatSseEvent } from "./sse.js";

describe("formatSseEvent", () => {
  it("formats named event with JSON data", () => {
    const heartbeat = createHeartbeat(new Date("2026-07-19T12:00:00.000Z"));
    const frame = formatSseEvent("heartbeat", heartbeat);

    expect(frame).toBe(
      'event: heartbeat\ndata: {"event":"heartbeat","serverTime":"2026-07-19T12:00:00.000Z"}\n\n'
    );
  });
});

