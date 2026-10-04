import { describe, expect, it } from "vitest";
import { toggleSlot } from "../src/components/booking/booking-widget";

describe("toggleSlot", () => {
  it("starts, extends either end, shrinks from an end, and restarts on a gap", () => {
    expect(toggleSlot([], "07:00", 60)).toEqual(["07:00"]);
    expect(toggleSlot(["07:00"], "08:00", 60)).toEqual(["07:00", "08:00"]);
    expect(toggleSlot(["07:00", "08:00"], "06:00", 60)).toEqual(["06:00", "07:00", "08:00"]);
    expect(toggleSlot(["06:00", "07:00", "08:00"], "08:00", 60)).toEqual(["06:00", "07:00"]);
    expect(toggleSlot(["07:00"], "10:00", 60)).toEqual(["10:00"]);
    expect(toggleSlot(["06:00", "07:30"], "09:00", 90)).toEqual(["06:00", "07:30", "09:00"]);
  });
});
