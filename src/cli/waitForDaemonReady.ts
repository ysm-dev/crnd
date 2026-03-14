import createRpcClient from "../shared/rpc/createRpcClient";

interface WaitForDaemonReadyOptions {
  attempts?: number;
  delayMs?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function waitForDaemonReady(
  options: WaitForDaemonReadyOptions = {},
) {
  const { attempts = 50, delayMs = 100 } = options;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const client = createRpcClient();
    if (client) {
      try {
        const res = await client.health.$get();
        if (res.ok) {
          return client;
        }
      } catch {}
    }

    if (attempt < attempts - 1) {
      await wait(delayMs);
    }
  }

  return null;
}
