"use client";

import { useMemo, useState } from "react";
import { castHexagram } from "@/lib/casting";
import { deriveCalendarInfo, formatShanghaiDateTime, type CalendarInfo } from "@/lib/calendar";
import type { AnalysisResult, CastingResult } from "@/lib/types";
import { HexagramDiagram } from "./HexagramDiagram";

type Mode = "datetime" | "manual";

const initialDateTime = formatShanghaiDateTime();

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number }) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ResultCard({ title, result, kind, movingLine }: { title: string; result: CastingResult["originalHexagram"]; kind: string; movingLine?: number }) {
  return (
    <article className="result-card">
      <div className="result-card-heading">
        <span className="result-kind">{kind}</span>
        <h3>{title}</h3>
      </div>
      <HexagramDiagram hexagram={result} movingLine={movingLine} />
      <p className="hexagram-name">{result.name}</p>
      <p className="hexagram-meta">上卦 {result.upper.name} · 下卦 {result.lower.name}</p>
    </article>
  );
}

export default function CastingApp() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("datetime");
  const [dateTime, setDateTime] = useState(initialDateTime);
  const [manual, setManual] = useState({ yearBranch: 2, lunarMonth: 8, lunarDay: 9, hourBranch: 8 });
  const [result, setResult] = useState<CastingResult | null>(null);
  const [calendarInfo, setCalendarInfo] = useState<CalendarInfo | null>(null);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const derived = useMemo(() => {
    if (mode !== "datetime") return null;
    try {
      return deriveCalendarInfo(dateTime);
    } catch {
      return null;
    }
  }, [dateTime, mode]);

  function handleCast() {
    setError("");
    setAnalysis(null);
    setAnalysisError("");
    if (!question.trim()) {
      setError("请先写下你真正想问的事情。");
      return;
    }

    try {
      if (mode === "datetime") {
        const input = deriveCalendarInfo(dateTime);
        setCalendarInfo(input);
        setResult(castHexagram(input));
      } else {
        setResult(castHexagram(manual));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "起卦失败，请检查输入。");
    }
  }

  async function handleAnalyze() {
    if (!result || !question.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const sessionStorageKey = "meihua-analysis-session";
      const analysisSession = window.sessionStorage.getItem(sessionStorageKey) || crypto.randomUUID();
      window.sessionStorage.setItem(sessionStorageKey, analysisSession);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-meihua-session": analysisSession },
        body: JSON.stringify({ question: question.trim(), castingResult: result }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI 分析暂时不可用。");
      setAnalysis(payload as AnalysisResult);
    } catch (cause) {
      setAnalysisError(cause instanceof Error ? cause.message : "AI 分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">梅</span>
          <div>
            <p className="brand-name">梅花起卦</p>
            <p className="brand-subtitle">先定其数，再观其变</p>
          </div>
        </div>
        <a className="rule-link" href="#rules">起卦规则</a>
      </header>

      <section className="intro-grid">
        <div className="intro-copy">
          <p className="eyebrow">MEIHUA YISHU</p>
          <h1>把你正在面对的事，交给一卦来照见。</h1>
          <p>用时间起卦法把当下的心念落成一卦。程序负责准确排卦，AI 只根据已经生成的卦象提供参考。</p>
        </div>
        <div className="intro-note">
          <span>本次起卦</span>
          <strong>{calendarInfo?.lunarLabel || (result && mode === "manual" ? "手动取数已生成" : "等待你的问题")}</strong>
          <small>固定规则计算，不由 AI 改卦。</small>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="input-panel" aria-labelledby="input-title">
          <div className="section-heading">
            <span className="section-index">输入</span>
            <h2 id="input-title">先把问题说清楚</h2>
          </div>

          <label className="field">
            <span>所问之事</span>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="例如：这份工作机会，是否值得我在今年内争取？" rows={4} />
            <small>问题越具体，AI 解读越容易落到实际情境。</small>
          </label>

          <div className="mode-switch" role="tablist" aria-label="起卦输入方式">
            <button type="button" className={mode === "datetime" ? "selected" : ""} onClick={() => { setMode("datetime"); setCalendarInfo(null); }} role="tab" aria-selected={mode === "datetime"}>日期时间</button>
            <button type="button" className={mode === "manual" ? "selected" : ""} onClick={() => { setMode("manual"); setCalendarInfo(null); }} role="tab" aria-selected={mode === "manual"}>手动输入四数</button>
          </div>

          <p className="method-note">
            <strong>{mode === "datetime" ? "时间起卦" : "手动输入四数"}</strong>
            {mode === "datetime" ? "取心念起动的当下时刻：年支、农历月、农历日与时辰。" : "这是时间起卦法的手动输入，不是“两数报数起卦”；四个数的含义保持不变。"}
          </p>

          {mode === "datetime" ? (
            <div className="datetime-block">
              <label className="field">
                <span>起卦日期和时间</span>
                <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} />
                <small>按 Asia/Shanghai 计算。子时按 23:00 开始处理。</small>
              </label>
              <div className="derived-box" aria-live="polite">
                <div><span>年支数</span><strong>{derived?.yearBranch ?? "-"} {derived?.yearBranchName ?? ""}</strong></div>
                <div><span>农历月日</span><strong>{derived ? `${derived.lunarMonth} 月 ${derived.lunarDay} 日` : "-"}</strong></div>
                <div><span>时辰数</span><strong>{derived?.hourBranch ?? "-"} {derived?.hourBranchName ?? ""}时</strong></div>
              </div>
            </div>
          ) : (
            <div className="manual-grid">
              <NumberField label="年支数" value={manual.yearBranch} onChange={(value) => setManual({ ...manual, yearBranch: value })} min={1} max={12} />
              <NumberField label="农历月" value={manual.lunarMonth} onChange={(value) => setManual({ ...manual, lunarMonth: value })} min={1} max={12} />
              <NumberField label="农历日" value={manual.lunarDay} onChange={(value) => setManual({ ...manual, lunarDay: value })} min={1} max={30} />
              <NumberField label="时辰数" value={manual.hourBranch} onChange={(value) => setManual({ ...manual, hourBranch: value })} min={1} max={12} />
            </div>
          )}

          {error && <p className="error-message" role="alert">{error}</p>}
          <button type="button" className="primary-button" onClick={handleCast}>起卦</button>
          <p className="privacy-note">点击“AI 分析”后，问题和卦象会发送到服务端配置的模型。</p>
        </section>

        <section className="result-panel" aria-labelledby="result-title">
          <div className="section-heading">
            <span className="section-index">结果</span>
            <h2 id="result-title">一卦三象</h2>
          </div>

          {result ? (
            <>
              <div className="result-grid">
                <ResultCard title="本卦" kind="当下" result={result.originalHexagram} movingLine={result.movingLine} />
                <ResultCard title="互卦" kind="过程" result={result.mutualHexagram} />
                <ResultCard title="变卦" kind="趋势" result={result.changedHexagram} />
              </div>
              <p className="result-caption">两个经卦组成一个本卦；互卦取本卦中间四爻，变卦由动爻阴阳互换得到。</p>

              <div className="body-use-box">
                <div><span>体卦</span><strong>{result.bodyUse.body.name} · {result.bodyUse.body.element}</strong></div>
                <div><span>用卦</span><strong>{result.bodyUse.use.name} · {result.bodyUse.use.element}</strong></div>
                <div><span>体用</span><strong>{result.bodyUse.relation}</strong></div>
                <p>{result.bodyUse.explanation}</p>
              </div>

              <details className="calculation-details">
                <summary>查看计算过程</summary>
                <div className="calculation-grid">
                  <span>年月日和</span><strong>{result.sums.upper} ÷ 8 → 上卦 {result.remainders.upper}</strong>
                  <span>年月日时和</span><strong>{result.sums.lower} ÷ 8 → 下卦 {result.remainders.lower}</strong>
                  <span>动爻</span><strong>{result.sums.moving} ÷ 6 → 第 {result.movingLine} 爻</strong>
                </div>
              </details>

              <div className="analysis-section">
                <div className="analysis-heading">
                  <div>
                    <span className="section-index">AI 解读</span>
                    <h3>让卦象回到你的问题</h3>
                  </div>
                  <button type="button" className="secondary-button" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? "正在分析" : analysis ? "重新分析" : "开始分析"}
                  </button>
                </div>
                {analysisError && <p className="error-message" role="alert">{analysisError}</p>}
                {isAnalyzing && <div className="analysis-loading"><span /><span /><span /></div>}
                {analysis && (
                  <div className="analysis-result">
                    <p className="analysis-summary">{analysis.summary}</p>
                    <div className="analysis-columns">
                      <div><h4>当下</h4><p>{analysis.currentState}</p></div>
                      <div><h4>趋势</h4><p>{analysis.trend}</p></div>
                    </div>
                    <div className="analysis-columns">
                      <div><h4>关键因素</h4><ul>{analysis.keyFactors.map((item) => <li key={item}>{item}</li>)}</ul></div>
                      <div><h4>可以做什么</h4><ul>{analysis.suggestions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    </div>
                    <p className="analysis-uncertainty"><strong>保留：</strong>{analysis.uncertainty}</p>
                    <p className="disclaimer">{analysis.disclaimer}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-result">
              <div className="empty-glyph">☰</div>
              <h3>结果会在这里展开</h3>
              <p>写下问题，选择起卦时间，然后让固定规则给出第一层答案。</p>
            </div>
          )}
        </section>
      </section>

      <section id="rules" className="rules-section">
        <div className="section-heading">
          <span className="section-index">规则</span>
          <h2>每一步都能复核</h2>
        </div>
        <div className="rules-grid">
          <p><strong>一</strong> 年支数、农历月、农历日之和除八，余数定上卦。</p>
          <p><strong>二</strong> 再加时辰数除八，余数定下卦。上下两个经卦合成一个本卦。</p>
          <p><strong>三</strong> 四数总和除六，余数定动爻。余数为零时取第六爻。</p>
          <p><strong>四</strong> 本卦二、三、四爻组成互卦下卦，三、四、五爻组成互卦上卦。</p>
          <p><strong>五</strong> 动爻阴阳互换得到变卦。本卦看当下，互卦看过程，变卦看趋势。</p>
          <p><strong>六</strong> 动爻所在的经卦为用，另一个经卦为体，再看体用五行生克比和。</p>
        </div>
        <p className="footer-note">起卦宜问题具体，以心念真正启动的时刻为准，同一件事不反复起卦。不同流派在报数、真太阳时等环节可能有差异，本工具固定当前规则以便复核。梅花易数与 AI 解读均属传统文化参考，不作为医疗、法律或投资建议。</p>
      </section>
    </main>
  );
}
