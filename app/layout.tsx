import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "자동 견적 생성기 | Modusign",
  description: "계약 건수 기반 AI 할인율 추천 및 견적서 자동 생성",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
