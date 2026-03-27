import { auth } from "@/lib/auth";

const DashboardPage = async () => {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
      <p className="mt-2 text-foreground/60">
        ようこそ、{session?.user?.name ?? "ユーザー"} さん
      </p>
    </div>
  );
};
export default DashboardPage;
