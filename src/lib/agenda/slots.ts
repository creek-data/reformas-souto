import { agenda } from "@/content/agenda";

/**
 * Huecos de visita. Todo se calcula en hora de Madrid y se devuelve en ISO
 * (UTC), para que el servidor (en UTC) y el navegador coincidan.
 */

export interface Interval {
  start: Date;
  end: Date;
}
export interface Booked {
  start: Date;
  zoneId: string | null;
}
export interface DaySlots {
  date: string;
  /** Hay otra visita ese día en la misma zona. */
  nearby: boolean;
  slots: { start: string; time: string }[];
}

const TZ = agenda.timezone;

/** Fecha y hora locales de Madrid de un instante. */
export function madridParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, weekday: wd };
}

/** «2026-11-12» + «09:00» en Madrid → instante UTC. Respeta el cambio de hora. */
export function madridToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = (t: number) => {
    const p = madridParts(new Date(t));
    const [py, pm, pd] = p.date.split("-").map(Number) as [number, number, number];
    const [ph, pmi] = p.time.split(":").map(Number) as [number, number];
    return Date.UTC(py, pm - 1, pd, ph, pmi) - t;
  };
  let t = guess - offset(guess);
  t = guess - offset(t);
  return new Date(t);
}

const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export function buildSlots({
  now = new Date(),
  busy = [],
  booked = [],
  zoneId = null,
}: {
  now?: Date;
  busy?: Interval[];
  booked?: Booked[];
  zoneId?: string | null;
}): DaySlots[] {
  const durMs = agenda.durationMin * 60_000;
  const earliest = now.getTime() + agenda.minNoticeHours * 3_600_000;
  const taken: Interval[] = [
    ...busy,
    ...booked.map((b) => ({ start: b.start, end: new Date(b.start.getTime() + durMs) })),
  ];
  const days: DaySlots[] = [];
  let date = madridParts(now).date;
  for (let guard = 0; days.length < agenda.workdaysAhead && guard < 60; guard++, date = addDays(date, 1)) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (!(agenda.weekdays as readonly number[]).includes(weekday)) continue;
    if ((agenda.holidays as readonly string[]).includes(date)) continue;
    const slots = agenda.times
      .map((time) => ({ time, start: madridToUtc(date, time) }))
      .filter(({ start }) => start.getTime() >= earliest)
      .filter(({ start }) => !taken.some((t) => overlaps(t, { start, end: new Date(start.getTime() + durMs) })))
      .map(({ time, start }) => ({ time, start: start.toISOString() }));
    const sameDay = booked.filter((b) => madridParts(b.start).date === date);
    days.push({ date, nearby: Boolean(zoneId) && sameDay.some((b) => b.zoneId === zoneId), slots });
  }
  return days.filter((d) => d.slots.length > 0);
}

/** ¿Sigue libre este inicio? Se comprueba otra vez al reservar. */
export function isSlotAvailable(startIso: string, args: Parameters<typeof buildSlots>[0]): boolean {
  return buildSlots(args).some((d) => d.slots.some((s) => s.start === startIso));
}

export const visitEnd = (start: Date) => new Date(start.getTime() + agenda.durationMin * 60_000);
