import type {
  BodyUse,
  CastingInput,
  CastingResult,
  Element,
  Hexagram,
  Trigram,
  TrigramNumber,
} from "./types";

const trigramData: Record<TrigramNumber, Trigram> = {
  1: { number: 1, name: "乾", nature: "天", element: "金", lines: [true, true, true] },
  2: { number: 2, name: "兑", nature: "泽", element: "金", lines: [true, true, false] },
  3: { number: 3, name: "离", nature: "火", element: "火", lines: [true, false, true] },
  4: { number: 4, name: "震", nature: "雷", element: "木", lines: [true, false, false] },
  5: { number: 5, name: "巽", nature: "风", element: "木", lines: [false, true, true] },
  6: { number: 6, name: "坎", nature: "水", element: "水", lines: [false, true, false] },
  7: { number: 7, name: "艮", nature: "山", element: "土", lines: [false, false, true] },
  8: { number: 8, name: "坤", nature: "地", element: "土", lines: [false, false, false] },
};

const hexagramNames: string[][] = [
  ["乾为天", "天泽履", "天火同人", "天雷无妄", "天风姤", "天水讼", "天山遁", "天地否"],
  ["泽天夬", "兑为泽", "泽火革", "泽雷随", "泽风大过", "泽水困", "泽山咸", "泽地萃"],
  ["火天大有", "火泽睽", "离为火", "火雷噬嗑", "火风鼎", "火水未济", "火山旅", "火地晋"],
  ["雷天大壮", "雷泽归妹", "雷火丰", "震为雷", "雷风恒", "雷水解", "雷山小过", "雷地豫"],
  ["风天小畜", "风泽中孚", "风火家人", "风雷益", "巽为风", "风水涣", "风山渐", "风地观"],
  ["水天需", "水泽节", "水火既济", "水雷屯", "水风井", "坎为水", "水山蹇", "水地比"],
  ["山天大畜", "山泽损", "山火贲", "山雷颐", "山风蛊", "山水蒙", "艮为山", "山地剥"],
  ["地天泰", "地泽临", "地火明夷", "地雷复", "地风升", "地水师", "地山谦", "坤为地"],
];

const elementCycle: Element[] = ["木", "火", "土", "金", "水"];

export function getTrigram(number: number): Trigram {
  const normalized = normalizeRemainder(number, 8) as TrigramNumber;
  return trigramData[normalized];
}

export function normalizeRemainder(value: number, divisor: number): number {
  const remainder = value % divisor;
  return remainder === 0 ? divisor : remainder;
}

function copyLines(lines: boolean[]): boolean[] {
  return [...lines];
}

function trigramFromLines(lines: boolean[]): Trigram {
  const match = Object.values(trigramData).find((trigram) =>
    trigram.lines.every((line, index) => line === lines[index]),
  );

  if (!match) {
    throw new Error("无法从爻线还原八卦");
  }

  return match;
}

function composeHexagram(upper: Trigram, lower: Trigram): Hexagram {
  return {
    name: hexagramNames[upper.number - 1][lower.number - 1],
    upper,
    lower,
    lines: [...copyLines(lower.lines), ...copyLines(upper.lines)],
  };
}

function createMutualHexagram(original: Hexagram): Hexagram {
  const lowerLines = [original.lines[1], original.lines[2], original.lines[3]];
  const upperLines = [original.lines[2], original.lines[3], original.lines[4]];
  return composeHexagram(trigramFromLines(upperLines), trigramFromLines(lowerLines));
}

function createChangedHexagram(original: Hexagram, movingLine: number): Hexagram {
  const changedLines = copyLines(original.lines);
  changedLines[movingLine - 1] = !changedLines[movingLine - 1];
  return composeHexagram(
    trigramFromLines(changedLines.slice(3, 6)),
    trigramFromLines(changedLines.slice(0, 3)),
  );
}

function relationBetween(body: Trigram, use: Trigram): Pick<BodyUse, "relation" | "explanation"> {
  if (body.element === use.element) {
    return { relation: "比和", explanation: "体用同属一行，力量相近，事情较看重双方协同。" };
  }

  const bodyIndex = elementCycle.indexOf(body.element);
  const useIndex = elementCycle.indexOf(use.element);

  if ((useIndex - bodyIndex + 5) % 5 === 1) {
    return { relation: "用生体", explanation: "外在之事对自身有助力，通常代表获得支持或资源。" };
  }

  if ((bodyIndex - useIndex + 5) % 5 === 1) {
    return { relation: "体生用", explanation: "自身力量流向所问之事，通常代表付出、消耗或投入。" };
  }

  if ((useIndex - bodyIndex + 5) % 5 === 2) {
    return { relation: "体克用", explanation: "自身对事情具有控制力，但也需要持续承担责任。" };
  }

  return { relation: "用克体", explanation: "外在环境对自身形成压力，宜谨慎观察和减少硬碰硬。" };
}

function getBodyUse(original: Hexagram, movingLine: number): BodyUse {
  const movingInLower = movingLine <= 3;
  const body = movingInLower ? original.upper : original.lower;
  const use = movingInLower ? original.lower : original.upper;
  return { body, use, ...relationBetween(body, use) };
}

export function validateCastingInput(input: CastingInput): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(input.yearBranch) || input.yearBranch < 1 || input.yearBranch > 12) {
    errors.push("年支数应为 1 到 12 的整数");
  }
  if (!Number.isInteger(input.lunarMonth) || input.lunarMonth < 1 || input.lunarMonth > 12) {
    errors.push("农历月应为 1 到 12 的整数");
  }
  if (!Number.isInteger(input.lunarDay) || input.lunarDay < 1 || input.lunarDay > 30) {
    errors.push("农历日应为 1 到 30 的整数");
  }
  if (!Number.isInteger(input.hourBranch) || input.hourBranch < 1 || input.hourBranch > 12) {
    errors.push("时辰数应为 1 到 12 的整数");
  }
  return errors;
}

export function castHexagram(input: CastingInput): CastingResult {
  const errors = validateCastingInput(input);
  if (errors.length > 0) {
    throw new Error(errors.join("；"));
  }

  const upperSum = input.yearBranch + input.lunarMonth + input.lunarDay;
  const lowerSum = upperSum + input.hourBranch;
  const upperRemainder = normalizeRemainder(upperSum, 8);
  const lowerRemainder = normalizeRemainder(lowerSum, 8);
  const movingRemainder = normalizeRemainder(lowerSum, 6);
  const movingLine = movingRemainder;
  const originalHexagram = composeHexagram(getTrigram(upperRemainder), getTrigram(lowerRemainder));

  return {
    inputs: {
      yearBranch: input.yearBranch,
      lunarMonth: input.lunarMonth,
      lunarDay: input.lunarDay,
      hourBranch: input.hourBranch,
    },
    sums: { upper: upperSum, lower: lowerSum, moving: lowerSum },
    remainders: { upper: upperRemainder, lower: lowerRemainder, moving: movingRemainder },
    movingLine,
    originalHexagram,
    mutualHexagram: createMutualHexagram(originalHexagram),
    changedHexagram: createChangedHexagram(originalHexagram, movingLine),
    bodyUse: getBodyUse(originalHexagram, movingLine),
  };
}
