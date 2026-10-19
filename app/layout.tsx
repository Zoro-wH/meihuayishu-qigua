import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "梅花起卦 | 先定其数，再观其变",
  description: "按梅花易数时间起卦规则生成本卦、互卦、变卦，并提供 AI 参考解读。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
