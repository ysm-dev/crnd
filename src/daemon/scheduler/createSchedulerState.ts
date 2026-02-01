import type { Cron } from "croner";

export default function createSchedulerState() {
  return {
    scheduled: new Map<string, Cron>(),
    running: new Set<string>(),
  };
}
