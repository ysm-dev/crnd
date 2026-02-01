import createEnvSchema from "./createEnvSchema";

export default function parseEnv(raw: string | null) {
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw);
  return createEnvSchema().parse(parsed);
}
