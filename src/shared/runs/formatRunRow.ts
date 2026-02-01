import createRunsSchemas from "../../db/schema/runsSchemas";

export default function formatRunRow(row: unknown) {
  const schema = createRunsSchemas().select;
  return schema.parse(row);
}
