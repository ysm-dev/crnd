import createJobsSchemas from "../../db/schema/jobsSchemas";
import parseCommand from "./parseCommand";
import parseEnv from "./parseEnv";

export default function formatJobRow(row: unknown) {
  const schema = createJobsSchemas().select;
  const parsed = schema.parse(row);

  return {
    ...parsed,
    command: parseCommand(parsed.command),
    env: parseEnv(parsed.env),
  };
}
