import { z } from "zod";

export default function createCommandSchema() {
  return z
    .array(z.string().min(1, "Command argument cannot be empty"), {
      error: "Command must be an array of strings",
    })
    .min(1, "Command is required (provide command after --)");
}
