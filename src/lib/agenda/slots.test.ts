import { describe, expect, it } from "vitest";
import { agenda } from "@/content/agenda";
import { buildSlots, isSlotAvailable, madridParts, madridToUtc } from "./slots";

describe("hora de Madrid", () => {
  it("convierte respetando invierno y verano", () => {
    expect(madridToUtc("2026-11-12", "09:00").toISOString()).toBe("2026-11-12T08:00:00.000Z");
    expect(madridToUtc("2027-06-10", "09:00").toISOString()).toBe("2027-06-10T07:00:00.000Z");
  });
  it("lee la fecha local", () => {
    expect(madridParts(new Date("2026-11-12T23:30:00Z")).date).toBe("2026-11-13");
  });
});

describe("huecos de visita", () => {
  const now = new Date("2026-11-11T18:00:00Z"); // miércoles por la tarde

  it("respeta la antelación mínima, fines de semana y festivos", () => {
    const days = buildSlots({ now });
    const first = new Date(days[0]!.slots[0]!.start).getTime();
    expect(first - now.getTime()).toBeGreaterThanOrEqual(agenda.minNoticeHours * 3_600_000);
    for (const d of days) {
      const wd = new Date(`${d.date}T12:00:00Z`).getUTCDay();
      expect([0, 6]).not.toContain(wd);
      expect(agenda.holidays as readonly string[]).not.toContain(d.date);
    }
    expect(days.map((d) => d.date)).not.toContain("2026-12-08");
  });

  it("quita lo ocupado en Google Calendar y las visitas ya reservadas", () => {
    const start = madridToUtc("2026-11-13", "10:30");
    const busy = [{ start, end: new Date(start.getTime() + 30 * 60_000) }];
    const booked = [{ start: madridToUtc("2026-11-13", "12:00"), zoneId: "madrid-norte" }];
    const day = buildSlots({ now, busy, booked }).find((d) => d.date === "2026-11-13")!;
    const times = day.slots.map((s) => s.time);
    expect(times).not.toContain("10:30");
    expect(times).not.toContain("12:00");
    expect(times).toContain("16:30");
  });

  it("marca los días con visita en la misma zona", () => {
    const booked = [{ start: madridToUtc("2026-11-16", "09:00"), zoneId: "madrid-sur" }];
    const days = buildSlots({ now, booked, zoneId: "madrid-sur" });
    expect(days.find((d) => d.date === "2026-11-16")?.nearby).toBe(true);
    expect(days.find((d) => d.date === "2026-11-17")?.nearby).toBe(false);
  });

  it("vuelve a comprobar el hueco al reservar", () => {
    const iso = madridToUtc("2026-11-13", "16:30").toISOString();
    expect(isSlotAvailable(iso, { now })).toBe(true);
    expect(isSlotAvailable(iso, { now, booked: [{ start: new Date(iso), zoneId: null }] })).toBe(false);
    expect(isSlotAvailable("2026-11-14T09:00:00.000Z", { now })).toBe(false); // sábado
  });
});
