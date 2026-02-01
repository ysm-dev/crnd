import createCommandSchema from "./createCommandSchema";

export default function parseCommand(raw: string) {
  const parsed = JSON.parse(raw);
  return createCommandSchema().parse(parsed);
}
