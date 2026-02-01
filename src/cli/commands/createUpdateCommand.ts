import createScheduleCommand from "./createScheduleCommand";

export default function createUpdateCommand() {
  const base = createScheduleCommand();
  return {
    ...base,
    meta: {
      ...base.meta,
      name: "update",
      description: "Update a job",
    },
  };
}
