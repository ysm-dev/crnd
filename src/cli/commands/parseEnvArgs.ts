import createEnvSchema from "../../shared/jobs/createEnvSchema";

export default function parseEnvArgs(input: unknown) {
  if (!input) {
    return undefined;
  }

  const values = Array.isArray(input) ? input : [input];
  const env: Record<string, string> = {};

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const index = value.indexOf("=");
    if (index <= 0) {
      throw new Error(`Invalid env entry: ${value}`);
    }
    const key = value.slice(0, index);
    const val = value.slice(index + 1);
    if (!key || !val) {
      throw new Error(`Invalid env entry: ${value}`);
    }
    env[key] = val;
  }

  return createEnvSchema().parse(env);
}
