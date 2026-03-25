export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-4 px-6 py-12">
      <p className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
        Bootstrap complete
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">devin-task-board</h1>
      <p className="max-w-2xl text-muted-foreground">
        Next.js 16, React 19, TypeScript, PostgreSQL, Prisma, Tailwind v4,
        shadcn/ui-ready scaffold.
      </p>
    </main>
  );
}
