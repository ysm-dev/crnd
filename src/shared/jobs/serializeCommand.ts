import createCommandSchema from "./createCommandSchema";

export default function serializeCommand(command: string[]) {
  const parsed = createCommandSchema().parse(command);
  return JSON.stringify(parsed);
}
