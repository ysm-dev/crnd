import { writeFileSync } from "node:fs";
import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createExportCommand() {
  return defineCommand({
    meta: {
      name: "export",
      description: "Export jobs to TOML"
    },
    args: {
      output: {
        type: "string",
        alias: "o"
      },
      json: {
        type: "boolean",
        alias: "j"
      }
    },
    async run({ args }) {
      const client = createRpcClient();
      if (!client) {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.export.$post();
        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`export: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (args.output) {
          writeFileSync(args.output, data.toml, "utf-8");
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify({ ok: true, output: args.output }));
          } else {
            console.log(`export: wrote ${args.output}`);
          }
          return;
        }

        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(data.toml);
      } catch {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
      }
    }
  });
}
