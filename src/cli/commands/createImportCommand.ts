import { readFileSync } from "node:fs";
import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createImportCommand() {
  return defineCommand({
    meta: {
      name: "import",
      description: "Import jobs from TOML",
    },
    args: {
      file: {
        type: "string",
        alias: "f",
        required: true,
      },
      json: {
        type: "boolean",
        alias: "j",
      },
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

      let toml: string;
      try {
        toml = readFileSync(args.file, "utf-8");
      } catch {
        const payload = { status: "missing_file" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("import: failed to read file");
        }
        process.exitCode = 2;
        return;
      }

      try {
        const res = await client.import.$post({ json: { toml } });
        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`import: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log("import: ok");
      } catch {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
      }
    },
  });
}
