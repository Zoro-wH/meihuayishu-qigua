export type TrigramNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
export type Element = "木" | "火" | "土" | "金" | "水";

export type Trigram = {
  number: TrigramNumber;
  name: TrigramName;
  nature: string;
  element: Element;
  lines: boolean[];
};

export type Hexagram = {
  name: string;
  upper: Trigram;
  lower: Trigram;
  lines: boolean[];
};

export type CastingInput = {
  yearBranch: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: number;
};

export type BodyUse = {
  body: Trigram;
  use: Trigram;
  relation: string;
  explanation: string;
};

export type CastingResult = {
  inputs: CastingInput;
  sums: {
    upper: number;
    lower: number;
    moving: number;
  };
  remainders: {
    upper: number;
    lower: number;
    moving: number;
  };
  movingLine: number;
  originalHexagram: Hexagram;
  mutualHexagram: Hexagram;
  changedHexagram: Hexagram;
  bodyUse: BodyUse;
};

export type AnalysisResult = {
  summary: string;
  currentState: string;
  trend: string;
  keyFactors: string[];
  suggestions: string[];
  uncertainty: string;
  disclaimer: string;
};
