import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "배철수의 음악캠프 플레이리스트",
  description: "매일 방송되는 배철수의 음악캠프 선곡표를 YouTube 플레이리스트로.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
