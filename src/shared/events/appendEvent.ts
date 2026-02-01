import { appendFileSync } from "node:fs";
import getEventsPath from "../paths/getEventsPath";

export default function appendEvent(type: string, payload?: Record<string, unknown>) {
  const record = {
    type,
    timestamp: new Date().toISOString(),
    payload
  };

  const line = `${JSON.stringify(record)}\n`;
  appendFileSync(getEventsPath(), line, "utf-8");
}
