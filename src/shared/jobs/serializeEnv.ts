import createEnvSchema from "./createEnvSchema";

export default function serializeEnv(env: Record<string, string>) {
  const parsed = createEnvSchema().parse(env);
  return JSON.stringify(parsed);
}
