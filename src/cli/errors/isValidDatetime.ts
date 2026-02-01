/**
 * Validates that a string is a valid ISO 8601 datetime.
 * Accepts both UTC (with Z suffix) and local datetimes (without timezone).
 * Local datetimes should be used with the -z timezone flag.
 */
export default function isValidDatetime(value: string): boolean {
  // ISO 8601 datetime patterns:
  // - With timezone: 2026-02-01T10:00:00Z or 2026-02-01T10:00:00+09:00
  // - Local (no timezone): 2026-02-01T10:00:00
  const isoDatetimeRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

  if (!isoDatetimeRegex.test(value)) {
    return false;
  }

  // Additionally verify it's a valid date
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/**
 * Checks if a datetime string has an explicit timezone.
 */
export function hasTimezone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}
