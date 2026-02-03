import { readFileSync } from "node:fs";
import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

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
      // Validate file before daemon connection
      let toml: string;
      try {
        toml = readFileSync(args.file, "utf-8");
      } catch {
        const payload = {
          status: "file_not_found",
          code: 400,
          message: `Could not read file: ${args.file}`,
          errors: [
            {
              field: "file",
              message: `File not found or not readable: ${args.file}`,
            },
          ],
        };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log(`import: could not read file "${args.file}"`);
          console.log("  Ensure the file exists and is readable");
        }
        process.exitCode = 2;
        return;
      }

      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("import: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.import.$post({ json: { toml } });
        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "import");
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(message);
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
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("import: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
