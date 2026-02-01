import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import startServer from "../../src/daemon/server/startServer";

describe("startServer", () => {
  test("starts and stops", () => {
    const app = new Hono().get("/health", (c) => c.text("ok"));
    const server = startServer(app);
    expect(typeof server.port).toBe("number");
    server.stop();
  });
});
