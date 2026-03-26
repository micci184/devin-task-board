import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "devin-task-board",
  description: "タスク管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
