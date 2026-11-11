import { describe, expect, it } from "vitest";
import { isMadridCapital, zoneForCp, zoneLabel } from "./zones";

describe("zonas por código postal", () => {
  it("distingue capital, comunidad y fuera", () => {
    expect(isMadridCapital("28019")).toBe(true);
    expect(zoneForCp("28019").capital).toBe(true);
    expect(zoneForCp("28915").id.startsWith("area-")).toBe(true);
    expect(zoneForCp("19005").dir).toBe("fuera");
    expect(zoneLabel(zoneForCp("19005").id)).toBe("Fuera: Guadalajara");
  });
});
