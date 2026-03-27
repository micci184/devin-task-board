import "./globals.css";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { SessionProvider } from "@/components/layout/SessionProvider";

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
    <html lang="ja" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
};
export default RootLayout;
