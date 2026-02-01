import type { Hono } from "hono";

export default function startServer(app: Hono) {
  const basePort = 51337;
  const attempts = 25;

  for (let offset = 0; offset < attempts; offset += 1) {
    const port = basePort + offset;
    try {
      return Bun.serve({
        fetch: app.fetch,
        hostname: "127.0.0.1",
        port
      });
    } catch (error) {
      if (offset === attempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to bind to a local port");
}
