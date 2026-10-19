import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AnalysisResult, CastingResult } from "@/lib/types";

export const runtime = "nodejs";

const analysisKeys: (keyof AnalysisResult)[] = [
  "summary",
  "currentState",
  "trend",
  "keyFactors",
  "suggestions",
  "uncertainty",
  "disclaimer",
];

const requestWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const requestHistory = new Map<string, number[]>();

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return analysisKeys.every((key) => {
    if (!(key in candidate)) return false;
    return key === "keyFactors" || key === "suggestions"
      ? Array.isArray(candidate[key]) && candidate[key].every((item) => typeof item === "string")
      : typeof candidate[key] === "string";
  });
}

function parseJson(text: string): AnalysisResult | null {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return isAnalysisResult(parsed) ? parsed : null;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return isAnalysisResult(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function isCastingResult(value: unknown): value is CastingResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CastingResult>;
  return Boolean(candidate.originalHexagram?.name && candidate.mutualHexagram?.name && candidate.changedHexagram?.name && candidate.bodyUse?.relation && candidate.movingLine);
}

function getRequestKey(request: Request): string {
  const session = request.headers.get("x-meihua-session");
  if (session) return `session:${session.slice(0, 128)}`;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwardedFor || "unknown"}`;
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  const key = getRequestKey(request);
  const recent = (requestHistory.get(key) || []).filter((timestamp) => now - timestamp < requestWindowMs);
  if (recent.length >= maxRequestsPerWindow) {
    requestHistory.set(key, recent);
    return true;
  }
  recent.push(now);
  requestHistory.set(key, recent);
  return false;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源不被允许。" }, { status: 403 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试。" }, { status: 429 });
  }

  const token = process.env.ANTHROPIC_AUTH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "服务端尚未配置 AI 令牌。" }, { status: 503 });
  }

  let body: { question?: unknown; castingResult?: unknown };
  try {
    const rawBody = await request.text();
    if (rawBody.length > 32_000) {
      return NextResponse.json({ error: "请求内容过大。" }, { status: 413 });
    }
    body = JSON.parse(rawBody) as { question?: unknown; castingResult?: unknown };
  } catch {
    return NextResponse.json({ error: "请求格式无效。" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 500 || !isCastingResult(body.castingResult)) {
    return NextResponse.json({ error: "请提供有效的问题和起卦结果。" }, { status: 400 });
  }

  const client = new Anthropic({
    apiKey: token,
    baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic",
    timeout: Number(process.env.API_TIMEOUT_MS || 3000000),
    defaultHeaders: {
      "User-Agent": "meihua-yigua/0.1.0",
      "x-opencode-session": request.headers.get("x-meihua-session") || crypto.randomUUID(),
    },
  });

  const system = `你是一个谨慎、清晰的梅花易数文化解释助手。
只根据用户提供的问题和已经计算好的卦象进行解释，不重新起卦，不修改卦名、动爻或体用关系，不编造用户背景。
请用中文回答，保持具体、克制、可行动。不要把卦象当作确定的科学预测，也不要提供医疗、法律、投资等领域的确定性建议。
必须只返回 JSON，不要 Markdown，不要代码围栏，结构如下：
{
  "summary": "一句话总结",
  "currentState": "结合本卦说明当下",
  "trend": "结合互卦和变卦说明趋势",
  "keyFactors": ["关键因素1", "关键因素2"],
  "suggestions": ["建议1", "建议2"],
  "uncertainty": "说明不确定性和需要观察的地方",
  "disclaimer": "传统文化参考提示"
}`;

  const userContent = JSON.stringify({ question, castingResult: body.castingResult }, null, 2);

  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "MiniMax-M3",
      max_tokens: 1600,
      temperature: 0.5,
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: userContent }],
    });
    const text = message.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
    const parsed = parseJson(text);
    if (!parsed) return NextResponse.json({ error: "模型返回格式无法识别，请重试。" }, { status: 502 });
    return NextResponse.json(parsed);
  } catch (cause) {
    const status = cause instanceof Anthropic.APIError ? cause.status : 502;
    if (status === 401 || status === 403) return NextResponse.json({ error: "AI 鉴权失败，请检查服务端令牌。" }, { status: 502 });
    if (status === 429) return NextResponse.json({ error: "AI 当前请求较多，请稍后重试。" }, { status: 429 });
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试。" }, { status: status >= 500 ? 502 : 500 });
  }
}
