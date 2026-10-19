import { describe, expect, it } from "vitest";
import { deriveCalendarInfo } from "./calendar";
import { castHexagram } from "./casting";

describe("自动时间取数", () => {
  it("与同一组手动取数得到的卦象一致", () => {
    const calendar = deriveCalendarInfo("2026-10-19T19:00");
    const automatic = castHexagram(calendar);
    const manual = castHexagram({
      yearBranch: calendar.yearBranch,
      lunarMonth: calendar.lunarMonth,
      lunarDay: calendar.lunarDay,
      hourBranch: calendar.hourBranch,
    });

    expect(calendar.lunarMonth).toBe(9);
    expect(calendar.lunarDay).toBe(10);
    expect(calendar.hourBranchName).toBe("戌");
    expect(automatic).toEqual(manual);
  });
});
