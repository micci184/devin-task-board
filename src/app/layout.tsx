import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "devin-task-board",
  description: "タスク管理アプリ",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
};
export default RootLayout;
