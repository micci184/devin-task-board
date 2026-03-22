# devin-task-board

Next.js 16 + PostgreSQL + Prisma + Tailwind CSS v4 + shadcn/ui を使ったタスク管理アプリの開発基盤です。

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- PostgreSQL 16
- Prisma ORM
- Tailwind CSS v4
- shadcn/ui (CLI v4 設定)
- Auth.js v5 (設定ファイルを用意)

## Setup (Docker)

1. 環境変数ファイルを作成

```bash
cp .env.example .env
```

2. 開発環境を起動

```bash
docker compose up --build
```

3. 別ターミナルで DB スキーマ適用（初回のみ）

```bash
docker compose exec app npm run db:push
```

4. Seed データ投入（任意）

```bash
docker compose exec app npm run prisma:seed
```

アプリ: `http://localhost:3000`

## Setup (Local)

```bash
npm install
npm run prisma:generate
npm run dev
```

## Project Structure (bootstrap)

- `src/app/` Next.js App Router
- `src/lib/prisma.ts` Prisma シングルトン
- `src/lib/auth.ts` Auth.js 設定の土台
- `prisma/schema.prisma` Prisma schema
- `docker-compose.yml` app + db
- `src/app/globals.css` OKLCH + `@theme inline` カラー定義
