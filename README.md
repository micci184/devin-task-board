# devin-task-board

PostgreSQL + Prisma + Docker Compose を中心にした開発基盤です。Next.js の初期生成物は一度削除しています。

## Tech Stack

- PostgreSQL 16
- Prisma ORM

## Setup (Docker)

1. 環境変数ファイルを作成

```bash
cp .env.example .env
```

2. 開発環境を起動

```bash
docker compose up --build
```

3. 初回起動時に既存 migration が自動適用される

4. Seed データ投入（任意）

```bash
docker compose exec app npm run prisma:seed
```

DB: `http://localhost:5432`

## Setup (Local)

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```

スキーマ変更時は `npm run prisma:migrate -- --name <migration_name>` を使用します。

## Project Structure (bootstrap)

- `src/lib/prisma.ts` Prisma シングルトン
- `prisma/schema.prisma` Prisma schema
- `docker-compose.yml` app + db
