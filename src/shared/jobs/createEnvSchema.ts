import { z } from "zod";

export default function createEnvSchema() {
  return z.record(z.string(), z.string());
}
