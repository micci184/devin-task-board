# devin-task-board

Next.js 16 + PostgreSQL + Prisma + Tailwind CSS v4 のタスク管理アプリ。

## Tech Stack

- Next.js 16.2（App Router）+ React 19 + TypeScript
- PostgreSQL 16 + Prisma ORM
- Tailwind CSS v4
- Docker Compose

## Setup (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- アプリ: http://localhost:3000
- DB: localhost:5432

初回起動時に Prisma migration が自動適用されます。

## Setup (AI Agent / Devin)

AI Agent で作業する場合は、以下の順で環境を立ち上げる。

```bash
cp .env.example .env
docker compose up -d db
npx prisma generate
npx prisma migrate deploy
npm install
npm run dev
```

PR 作成前に最低限以下を実行すること。

```bash
npx next build
```

## Setup (Local)

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Documents

- [ER図（Mermaid）](docs/erd.md)
- [仕様書](docs/spec.md)

## Project Structure

```
src/app/layout.tsx       # ルートレイアウト
src/app/page.tsx         # トップページ
src/app/globals.css      # Tailwind CSS
src/lib/prisma.ts        # Prisma シングルトン
prisma/schema.prisma     # DB スキーマ
docker-compose.yml       # app + db
Dockerfile               # Node.js 22 Alpine
```
