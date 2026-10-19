# 梅花起卦

一个中文移动端优先的梅花易数时间起卦网页应用。起卦由固定规则完成，AI 只分析已经生成的本卦、互卦、变卦和体用关系。

## 本地运行

```bash
npm install
copy .env.example .env.local
npm run dev
```

将 `.env.local` 中的 `ANTHROPIC_AUTH_TOKEN` 替换为服务端令牌。`.env.local` 已被 Git 忽略，禁止提交真实令牌。

## 环境变量

生产环境只需要在 Vercel Project Settings → Environment Variables 中配置：

```env
ANTHROPIC_BASE_URL=https://opencode.ai/inference/go/anthropic
ANTHROPIC_AUTH_TOKEN=<server-side-token>
ANTHROPIC_MODEL=deepseek-v4.1-flash
API_TIMEOUT_MS=3000000
```

令牌只由服务端的 `/api/analyze` 读取。不要使用 `NEXT_PUBLIC_` 前缀，也不要把令牌写入 GitHub、浏览器代码或日志。

## 验证

```bash
npm run security:scan
npm run typecheck
npm test
npm run build
```

`security:scan` 只报告文件路径和检测类型，不输出可能的令牌内容。

## 起卦方式

当前采用时间起卦法：年支数、农历月、农历日之和除八取上卦；加时辰数除八取下卦；四数总和除六取动爻。上下两个经卦组成一个本卦，中间四爻组成互卦，动爻阴阳互换得到变卦。

梅花易数与 AI 解读属于传统文化参考，不作为医疗、法律或投资建议。
