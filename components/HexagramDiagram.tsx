import type { Hexagram } from "@/lib/types";

type Props = {
  hexagram: Hexagram;
  movingLine?: number;
};

export function HexagramDiagram({ hexagram, movingLine }: Props) {
  return (
    <div className="hexagram-diagram" aria-label={`${hexagram.name}六爻图`}>
      {hexagram.lines
        .map((isYang, index) => ({ isYang, line: index + 1 }))
        .reverse()
        .map(({ isYang, line }) => (
          <div className="hexagram-line-row" key={line}>
            <span className={`line-mark ${isYang ? "yang" : "yin"}`} aria-hidden="true">
              {isYang ? <i /> : <><i /><i /></>}
            </span>
            <span className={`line-number ${movingLine === line ? "active" : ""}`}>
              {movingLine === line ? "动爻" : `${line}爻`}
            </span>
          </div>
        ))}
    </div>
  );
}
