import type { MiddlewareHandler } from "hono";
import { unauthorizedResponse } from "./routes/createErrorResponse";

export default function createAuthMiddleware(token: string): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header("authorization");
    const value = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : null;

    if (!value || value !== token) {
      return c.json(unauthorizedResponse(), 401);
    }

    await next();
  };
}
