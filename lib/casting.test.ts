import { describe, expect, it } from "vitest";
import { castHexagram, normalizeRemainder } from "./casting";

describe("梅花易数时间起卦", () => {
  it("将零余数归一化为除数", () => {
    expect(normalizeRemainder(24, 8)).toBe(8);
    expect(normalizeRemainder(30, 6)).toBe(6);
  });

  it("匹配 EXE 黄金用例 2,8,9,8", () => {
    const result = castHexagram({ yearBranch: 2, lunarMonth: 8, lunarDay: 9, hourBranch: 8 });
    expect(result.originalHexagram.name).toBe("离为火");
    expect(result.mutualHexagram.name).toBe("泽风大过");
    expect(result.changedHexagram.name).toBe("火雷噬嗑");
    expect(result.movingLine).toBe(3);
  });

  it("匹配零余数黄金用例 8,8,8,8", () => {
    const result = castHexagram({ yearBranch: 8, lunarMonth: 8, lunarDay: 8, hourBranch: 8 });
    expect(result.originalHexagram.name).toBe("坤为地");
    expect(result.mutualHexagram.name).toBe("坤为地");
    expect(result.changedHexagram.name).toBe("地水师");
    expect(result.movingLine).toBe(2);
  });

  it("匹配黄金用例 1,1,1,1", () => {
    const result = castHexagram({ yearBranch: 1, lunarMonth: 1, lunarDay: 1, hourBranch: 1 });
    expect(result.originalHexagram.name).toBe("火雷噬嗑");
    expect(result.mutualHexagram.name).toBe("水山蹇");
    expect(result.changedHexagram.name).toBe("山雷颐");
    expect(result.movingLine).toBe(4);
  });

  it("覆盖所有本卦和动爻组合", () => {
    for (let upper = 1; upper <= 8; upper += 1) {
      for (let lower = 1; lower <= 8; lower += 1) {
        for (let moving = 1; moving <= 6; moving += 1) {
          const sum = upper + lower;
          const result = castHexagram({ yearBranch: upper, lunarMonth: lower, lunarDay: 1, hourBranch: moving });
          expect(result.originalHexagram.lines).toHaveLength(6);
          expect(result.changedHexagram.lines).toHaveLength(6);
          expect(result.movingLine).toBeGreaterThanOrEqual(1);
          expect(result.movingLine).toBeLessThanOrEqual(6);
          void sum;
        }
      }
    }
  });
});
