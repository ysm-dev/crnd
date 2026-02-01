import { z } from "zod";

export default function createCommandSchema() {
  return z.array(z.string().min(1)).min(1);
}
