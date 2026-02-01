import { Hono } from "hono";

export default function registerShutdownRoute(shutdown: () => void) {
  return new Hono().post("/daemon/shutdown", (c) => {
    const response = c.json({ ok: true });
    setTimeout(() => shutdown(), 10);
    return response;
  });
}
