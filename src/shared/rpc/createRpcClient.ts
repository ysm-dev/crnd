import { hc } from "hono/client";
import type { AppType } from "../../daemon/server/createApp";
import readDaemonState from "../state/readDaemonState";

export default function createRpcClient() {
  try {
    const state = readDaemonState();
    if (!state) {
      return null;
    }

    return hc<AppType>(`http://127.0.0.1:${state.port}`, {
      headers: {
        Authorization: `Bearer ${state.token}`
      }
    });
  } catch {
    return null;
  }
}
