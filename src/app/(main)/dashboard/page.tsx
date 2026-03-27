import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

const DashboardPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
        <p className="mt-2 text-foreground/60">
          ようこそ、{session.user?.name ?? "ユーザー"} さん
        </p>
      </div>
    </div>
  );
};
export default DashboardPage;
