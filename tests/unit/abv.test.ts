import { describe, expect, it } from "vitest";
import { calcAbv, effectiveAbv, round2 } from "@/lib/brewing/abv";

describe("calcAbv", () => {
  it("uses (OG − FG) × 131.25", () => {
    expect(calcAbv(1.05, 1.01)).toBe(5.25);
    expect(calcAbv(1.06, 1.012)).toBe(6.3);
  });

  it("returns null when a gravity is missing", () => {
    expect(calcAbv(null, 1.01)).toBeNull();
    expect(calcAbv(1.05, undefined)).toBeNull();
  });

  it("rounds the same way as Postgres numeric round", () => {
    expect(calcAbv(1.055, 1.012)).toBe(5.64);
  });
});

describe("round2", () => {
  it("rounds half away from zero", () => {
    expect(round2(1.225)).toBe(1.23);
    expect(round2(-1.225)).toBe(-1.23);
  });
});

describe("effectiveAbv", () => {
  it("prefers the override", () => {
    expect(effectiveAbv({ abvOverride: 6.1, abvCalculated: 5.25 })).toBe(6.1);
  });

  it("falls back to the calculation", () => {
    expect(effectiveAbv({ abvOverride: null, abvCalculated: 5.25 })).toBe(5.25);
  });

  it("treats a zero override as set", () => {
    expect(effectiveAbv({ abvOverride: 0, abvCalculated: 5.25 })).toBe(0);
  });
});
