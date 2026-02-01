import { describe, expect, test } from "bun:test";
import isValidDatetime, {
  hasTimezone,
} from "../../src/cli/errors/isValidDatetime";

describe("isValidDatetime", () => {
  test("accepts valid UTC datetime with Z", () => {
    expect(isValidDatetime("2026-02-01T10:00:00Z")).toBe(true);
    expect(isValidDatetime("2026-12-31T23:59:59Z")).toBe(true);
  });

  test("accepts valid datetime with milliseconds", () => {
    expect(isValidDatetime("2026-02-01T10:00:00.000Z")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00.123Z")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00.123456Z")).toBe(true);
  });

  test("accepts valid datetime with offset timezone", () => {
    expect(isValidDatetime("2026-02-01T10:00:00+00:00")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00-05:00")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00+09:00")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00+14:00")).toBe(true);
    expect(isValidDatetime("2026-02-01T10:00:00-12:00")).toBe(true);
  });

  test("accepts valid local datetime without timezone", () => {
    expect(isValidDatetime("2026-02-01T10:00:00")).toBe(true);
    expect(isValidDatetime("2026-12-31T23:59:59")).toBe(true);
  });

  test("rejects datetime without T separator", () => {
    expect(isValidDatetime("2026-02-01 10:00:00Z")).toBe(false);
    expect(isValidDatetime("2026-02-01 10:00:00")).toBe(false);
  });

  test("rejects date only", () => {
    expect(isValidDatetime("2026-02-01")).toBe(false);
  });

  test("rejects time only", () => {
    expect(isValidDatetime("10:00:00Z")).toBe(false);
    expect(isValidDatetime("10:00:00")).toBe(false);
  });

  test("rejects invalid date values", () => {
    expect(isValidDatetime("2026-13-01T10:00:00Z")).toBe(false); // month 13
    expect(isValidDatetime("2026-00-01T10:00:00Z")).toBe(false); // month 0
    // Note: JavaScript's Date accepts Feb 30 and wraps to March 2
    // This is expected behavior - we validate format, not semantic validity
  });

  test("rejects invalid time values", () => {
    expect(isValidDatetime("2026-02-01T25:00:00Z")).toBe(false); // hour 25
    expect(isValidDatetime("2026-02-01T10:60:00Z")).toBe(false); // minute 60
    expect(isValidDatetime("2026-02-01T10:00:60Z")).toBe(false); // second 60
  });

  test("rejects malformed strings", () => {
    expect(isValidDatetime("not-a-date")).toBe(false);
    expect(isValidDatetime("")).toBe(false);
    expect(isValidDatetime("2026-2-1T10:00:00Z")).toBe(false); // missing leading zeros
    expect(isValidDatetime("2026-02-01T1:00:00Z")).toBe(false); // missing leading zero
  });

  test("rejects incomplete timezone offsets", () => {
    expect(isValidDatetime("2026-02-01T10:00:00+")).toBe(false);
    expect(isValidDatetime("2026-02-01T10:00:00+09")).toBe(false);
    expect(isValidDatetime("2026-02-01T10:00:00+9:00")).toBe(false);
  });
});

describe("hasTimezone", () => {
  test("returns true for UTC Z suffix", () => {
    expect(hasTimezone("2026-02-01T10:00:00Z")).toBe(true);
    expect(hasTimezone("2026-02-01T10:00:00.123Z")).toBe(true);
  });

  test("returns true for positive offset", () => {
    expect(hasTimezone("2026-02-01T10:00:00+00:00")).toBe(true);
    expect(hasTimezone("2026-02-01T10:00:00+09:00")).toBe(true);
  });

  test("returns true for negative offset", () => {
    expect(hasTimezone("2026-02-01T10:00:00-05:00")).toBe(true);
    expect(hasTimezone("2026-02-01T10:00:00-12:00")).toBe(true);
  });

  test("returns false for local datetime", () => {
    expect(hasTimezone("2026-02-01T10:00:00")).toBe(false);
    expect(hasTimezone("2026-02-01T10:00:00.123")).toBe(false);
  });

  test("returns false for date only", () => {
    expect(hasTimezone("2026-02-01")).toBe(false);
  });
});
