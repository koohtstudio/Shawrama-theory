// Everything about "when" for the shop. All business logic runs in America/Toronto.
export const TZ = "America/Toronto";
export const LAST_PICKUP_BUFFER_MIN = 10;

export type HoursRow = { dow: number; is_closed: boolean; opens: string | null; closes: string | null };
export type ClosureRow = {
  on_date: string;
  label: string;
  is_closed: boolean;
  opens: string | null;
  closes: string | null;
};
export type DayWindow = { opens: number; closes: number } | null; // minutes from midnight

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
});
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function torontoParts(d: Date = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = Number(p.hour);
  const minute = Number(p.minute);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    dow: DOW[p.weekday as string] ?? 0,
    hour,
    minute,
    minutes: hour * 60 + minute,
  };
}

export function parseHHMM(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** Convert a Toronto wall-clock date + minutes-from-midnight to a real instant. */
export function torontoToUtc(date: string, minutes: number): Date {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Offset of Toronto at that instant: compare the zone's wall clock with UTC.
  const wall = torontoParts(new Date(guess));
  const [wy, wm, wd] = wall.date.split("-").map(Number) as [number, number, number];
  const asUtc = Date.UTC(wy, wm - 1, wd, wall.hour, wall.minute);
  return new Date(guess - (asUtc - guess));
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function dowOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function windowFor(date: string, hours: HoursRow[], closures: ClosureRow[]): DayWindow {
  const c = closures.find((x) => x.on_date === date);
  const row = c ?? hours.find((h) => h.dow === dowOf(date));
  if (!row || row.is_closed || !row.opens || !row.closes) return null;
  return { opens: parseHHMM(row.opens), closes: parseHHMM(row.closes) };
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`;
}

export function formatInstant(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })
    .format(d)
    .replace(/\s?([ap])\.?m\.?/i, (_, x: string) => ` ${x.toLowerCase()}m`);
}

export type OpenStatus =
  | { isOpen: true; closesAt: number; label: string }
  | { isOpen: false; opensAt: number | null; label: string };

export function openStatus(now: Date, hours: HoursRow[], closures: ClosureRow[]): OpenStatus {
  const t = torontoParts(now);
  const today = windowFor(t.date, hours, closures);
  if (today && t.minutes >= today.opens && t.minutes < today.closes) {
    return { isOpen: true, closesAt: today.closes, label: `Open now until ${formatMinutes(today.closes)}` };
  }
  if (today && t.minutes < today.opens) {
    return { isOpen: false, opensAt: today.opens, label: `Opens today at ${formatMinutes(today.opens)}` };
  }
  for (let i = 1; i <= 7; i++) {
    const w = windowFor(addDays(t.date, i), hours, closures);
    if (w) {
      const when = i === 1 ? "tomorrow" : "on " + new Date(Date.UTC(2024, 0, 7 + dowOf(addDays(t.date, i)))).toLocaleDateString("en-CA", { weekday: "long", timeZone: "UTC" });
      return { isOpen: false, opensAt: w.opens, label: `Closed now, opens ${when} at ${formatMinutes(w.opens)}` };
    }
  }
  return { isOpen: false, opensAt: null, label: "Closed" };
}

export type Slot = { value: string; label: string; date: string };

/** Pickup slots for today (or the next open day if the rest of today is out). */
export function buildSlots(opts: {
  now: Date;
  hours: HoursRow[];
  closures: ClosureRow[];
  prepMinutes: number;
  slotMinutes: number;
  minLeadMinutes: number;
}): { date: string; isToday: boolean; slots: Slot[] } {
  const t = torontoParts(opts.now);
  const earliest = t.minutes + Math.max(opts.prepMinutes, opts.minLeadMinutes);
  for (let i = 0; i <= 7; i++) {
    const date = addDays(t.date, i);
    const w = windowFor(date, opts.hours, opts.closures);
    if (!w) continue;
    const start = i === 0 ? Math.max(w.opens + opts.prepMinutes, earliest) : w.opens + opts.prepMinutes;
    const last = w.closes - LAST_PICKUP_BUFFER_MIN;
    const slots: Slot[] = [];
    let m = Math.ceil(start / opts.slotMinutes) * opts.slotMinutes;
    for (; m <= last; m += opts.slotMinutes) {
      slots.push({ value: torontoToUtc(date, m).toISOString(), label: formatMinutes(m), date });
    }
    if (slots.length) return { date, isToday: i === 0, slots };
  }
  return { date: t.date, isToday: true, slots: [] };
}

/** Server-side check that a requested pickup instant is a real, open, reachable time. */
export function isPickupAllowed(opts: {
  pickupAt: Date;
  now: Date;
  hours: HoursRow[];
  closures: ClosureRow[];
  prepMinutes: number;
}): boolean {
  const p = torontoParts(opts.pickupAt);
  const w = windowFor(p.date, opts.hours, opts.closures);
  if (!w) return false;
  if (p.minutes < w.opens || p.minutes > w.closes - LAST_PICKUP_BUFFER_MIN) return false;
  const leadMs = opts.pickupAt.getTime() - opts.now.getTime();
  if (leadMs < (opts.prepMinutes - 1) * 60_000) return false;
  return leadMs < 8 * 24 * 3600_000;
}

/** ASAP is only available while the shop is open with time left before the last pickup. */
export function asapPickup(now: Date, prepMinutes: number, hours: HoursRow[], closures: ClosureRow[]): Date | null {
  const t = torontoParts(now);
  const w = windowFor(t.date, hours, closures);
  if (!w || t.minutes < w.opens) return null;
  const at = new Date(now.getTime() + prepMinutes * 60_000);
  const a = torontoParts(at);
  if (a.date !== t.date || a.minutes > w.closes - LAST_PICKUP_BUFFER_MIN) return null;
  return at;
}
