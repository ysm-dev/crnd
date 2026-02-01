import { describe, expect, test } from "bun:test";
import isOverlapPolicy from "../../src/shared/jobs/isOverlapPolicy";

describe("overlap policy", () => {
  test("valid values", () => {
    expect(isOverlapPolicy("skip")).toBe(true);
    expect(isOverlapPolicy("allow")).toBe(true);
  });

  test("invalid values", () => {
    expect(isOverlapPolicy("other")).toBe(false);
  });
});
