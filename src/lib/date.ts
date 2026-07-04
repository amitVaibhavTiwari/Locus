// This is the main and only file for date related stuff used throughout the code.
//
//  There are two kinds of dates stored in the DB:
//   - ISO timestamps (created_at etc.) — stored as UTC, new Date() handles them fine
//   - Date-only strings (due_date, start/end_date) — stored as "YYYY-MM-DD" from form inputs. (This has some problems.)
//     DO NOT use new Date("YYYY-MM-DD") directly, it parses as UTC midnight and breaks in
//     timezones behind UTC.
// To handle above problem, use parseLocalDate() for anything date-only.

// This Parses "YYYY-MM-DD" as local midnight to avoid the UTC-offset gotcha.
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

// This formats a date-only string ("YYYY-MM-DD") for display.
export function formatDate(
  dateStr: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
): string {
  if (!dateStr) return "—";
  return parseLocalDate(dateStr).toLocaleDateString(undefined, opts);
}

// This formats a full UTC ISO timestamp for display.
export function formatDateTime(
  isoStr: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString(undefined, opts);
}

// This calculates how many days until a date. Negative means it's already past.
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (parseLocalDate(dateStr).getTime() - today.getTime()) / 86_400_000,
  );
}

// This calculates days since a date. Returns 0 if the date is today or in the future.
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round(
      (today.getTime() - parseLocalDate(dateStr).getTime()) / 86_400_000,
    ),
  );
}

// This calculates calendar days between two date strings (end - start).
export function daysBetween(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
): number | null {
  if (!startStr || !endStr) return null;
  return Math.round(
    (parseLocalDate(endStr).getTime() - parseLocalDate(startStr).getTime()) /
      86_400_000,
  );
}
