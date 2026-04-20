/** 日本時間（JST）の暦日 YYYY-MM-DD */
export function jstCalendarDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dailyPickCap(hasEmail: boolean): number {
  return hasEmail ? 10 : 5;
}
