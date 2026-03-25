import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "devin-task-board",
  description: "Task board scaffold with Next.js 16 + Prisma",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
