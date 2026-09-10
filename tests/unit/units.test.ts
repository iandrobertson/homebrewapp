import { describe, expect, it } from "vitest";
import {
  batchSizeInputToLiters,
  gallonsToLiters,
  litersToGallons,
  srmToEbc,
} from "@/lib/brewing/units";

describe("units", () => {
  it("converts a 5 gallon batch to litres", () => {
    expect(gallonsToLiters(5)).toBeCloseTo(18.927, 3);
    expect(litersToGallons(gallonsToLiters(5))).toBeCloseTo(5, 10);
  });

  it("stores US input as litres", () => {
    expect(batchSizeInputToLiters(5, "us")).toBeCloseTo(18.927, 3);
    expect(batchSizeInputToLiters(19, "metric")).toBe(19);
  });

  it("converts SRM to EBC", () => {
    expect(srmToEbc(10)).toBeCloseTo(19.7, 5);
  });
});
