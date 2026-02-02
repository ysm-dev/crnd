import { describe, expect, test } from "bun:test";
import parseRelativeTime from "../../src/cli/utils/parseRelativeTime";

describe("parseRelativeTime", () => {
  test("parses seconds", () => {
    const now = Date.now();
    const result = parseRelativeTime("30s");
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThan(now + 29000);
    expect(parsed).toBeLessThan(now + 31000);
  });

  test("parses minutes", () => {
    const now = Date.now();
    const result = parseRelativeTime("5m");
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThan(now + 4 * 60 * 1000);
    expect(parsed).toBeLessThan(now + 6 * 60 * 1000);
  });

  test("parses hours", () => {
    const now = Date.now();
    const result = parseRelativeTime("2h");
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThan(now + 1.9 * 60 * 60 * 1000);
    expect(parsed).toBeLessThan(now + 2.1 * 60 * 60 * 1000);
  });

  test("parses days", () => {
    const now = Date.now();
    const result = parseRelativeTime("1d");
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThan(now + 23 * 60 * 60 * 1000);
    expect(parsed).toBeLessThan(now + 25 * 60 * 60 * 1000);
  });

  test("parses long format", () => {
    const now = Date.now();
    const result = parseRelativeTime("5 minutes");
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThan(now + 4 * 60 * 1000);
    expect(parsed).toBeLessThan(now + 6 * 60 * 1000);
  });

  test("returns ISO 8601 format", () => {
    const result = parseRelativeTime("1h");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  test("throws for invalid format", () => {
    expect(() => parseRelativeTime("invalid")).toThrow(
      /Invalid relative time format/,
    );
  });

  test("throws for empty string", () => {
    expect(() => parseRelativeTime("")).toThrow(/Invalid relative time format/);
  });

  test("throws for negative time", () => {
    expect(() => parseRelativeTime("-5m")).toThrow(
      /Relative time must be positive/,
    );
  });
});
