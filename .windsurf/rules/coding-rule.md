---
trigger: always_on
---

# devin-task-board Rules

## プロジェクト概要

リッチなタスク管理アプリ（Jira ミニ版）。Docker Compose + Next.js 16 + PostgreSQL + Prisma。

## 技術スタック（厳守）

- Next.js 16.2（App Router）、React 19、TypeScript 必須
- PostgreSQL 16 + Prisma ORM
- Tailwind CSS v4（OKLCH色空間）
- Auth.js v5（next-auth@5、Credentials Provider）
- next-intl（ja / en）
- zod（フォーム + API バリデーション）
- recharts（グラフ）、@dnd-kit/core（D&D）、date-fns（日付）
- react-markdown + remark-gfm（Markdown）
- resend（メール通知）
- Docker Compose
- 状態管理ライブラリ（Redux, Zustand 等）は使わない

## Agent Skills

`npx skills add vercel-labs/next-skills` でインストール済み。
Next.js のベストプラクティス（RSC境界、async API、ファイル規約等）は
`.agents/skills/` 内の SKILL.md および `node_modules/next/dist/docs/` を参照すること。

## ディレクトリ構成

```
src/app/(auth)/          # ログイン、サインアップ
src/app/(main)/          # 認証必須（dashboard, projects, notifications, settings, admin）
src/app/api/             # OpenAPI 3.1 準拠の Route Handlers
src/app/globals.css      # カラー定義（OKLCH + @theme inline）
src/app/proxy.ts         # 認証ガード（Next.js 16: 旧 middleware.ts）
src/components/ui/       # 共通UIコンポーネント
src/components/layout/   # Header, Sidebar
src/components/tasks/    # TaskCard, TaskForm, TaskDetail
src/components/board/    # KanbanBoard, KanbanColumn
src/components/gantt/    # GanttChart
src/components/dashboard/ # StatCard, Charts
src/components/comments/ # CommentList, CommentForm
src/components/notifications/ # NotificationBell, NotificationList
src/lib/prisma.ts        # Prisma シングルトン
src/lib/auth.ts          # Auth.js v5 設定
src/lib/validations/     # zod スキーマ
src/types/               # TypeScript 型定義
src/messages/            # i18n（ja.json, en.json）
docs/openapi.yaml        # OpenAPI 3.1 仕様（実装はこれに準拠）
docs/spec.md             # 機能仕様書（画面一覧、Issue 分解計画）
prisma/schema.prisma     # DB スキーマ定義
```

## カラー定義（globals.css で CSS変数として定義）

tailwind.config は編集しない。色は globals.css の `:root` と `.dark` に OKLCH で定義し、
`@theme inline` でTailwindユーティリティに公開する。

```css
:root {
  --primary: oklch(0.35 0.08 230);
  --primary-foreground: oklch(0.98 0 0);
  --success: oklch(0.65 0.17 160);
  --warning: oklch(0.75 0.15 85);
  --danger: oklch(0.55 0.22 27);
}
.dark {
  --primary: oklch(0.55 0.1 230);
  --primary-foreground: oklch(0.1 0 0);
}
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

## API設計

- OpenAPI 3.1 仕様を `docs/openapi.yaml` に定義し、それに準拠して実装する
- エンドポイント: `/api/[resource]`、REST
- レスポンス形式: 成功 `{ data: T }` / エラー `{ error: { code: string, message: string } }`
- 全 API Route で zod バリデーション必須
- ステータスコード: 400（バリデーション）、401（認証）、403（権限）、404（Not Found）

## コーディング規約

- `any` 型禁止。型は `src/types/` に集約
- コンポーネント: PascalCase、フック: camelCase、ディレクトリ: kebab-case
- Server Components がデフォルト。`"use client"` は末端のみ
- props は interface で定義（type ではなく）
- Server Components 内では Prisma を直接呼ぶ（fetch で内部API を叩かない）
- エラー: API は try-catch + 統一レスポンス、UI は sonner トースト + Skeleton
- Tailwind ユーティリティのみ使用。インラインスタイル・CSS Modules 禁止
- ダークモード: Tailwind `dark:` バリアント + next-themes（ThemeProvider）

## Issue駆動の実装範囲

- 実装対象は、対象Issueの「概要」「Acceptance Criteria」「技術的な参考情報」に含まれる範囲のみとする
- `docs/spec.md` と `docs/user-stories.md` は参照資料であり、対象Issueに記載のない後続機能や将来構成を先回りして実装しない
- スコープ判断に迷う場合は、Issueの記載を優先し、不明点は確認する
- PRには対象Issueに直接関係しない変更（リファクタ、将来用ディレクトリ、未使用設定、別Issue相当の追加）を含めない

## PR差分原則

- PRの差分は、対象Issueの実装に直接関係する変更のみとする
- PRの差分には、対象Issueに直接関係しない変更（リファクタ、将来用ディレクトリ、未使用設定、別Issue相当の追加）を含めない
- PRの差分は、対象Issueの実装に必要な変更のみとする

## Next.js 16 の注意点

- `middleware.ts` は非推奨 → `proxy.ts` にリネーム（Edge Runtime 非対応）
- async Request API: `params`, `searchParams`, `cookies()`, `headers()` は必ず await
- Turbopack 設定は `nextConfig.turbopack` に（`experimental.turbopack` は非推奨）
- Cache Components: `'use cache'` ディレクティブ + `cacheLife()` + `cacheTag()`

## DB設計

- Prisma model: PascalCase 単数形。全テーブルに id(cuid), createdAt, updatedAt
- 外部キー: 適切に ON DELETE CASCADE
- インデックス: status, priority, assigneeId, projectId
- ソフトデリート不採用（物理削除）
- 開発環境のDB適用は `prisma migrate dev` を使用し、既存 migration の反映は `prisma migrate deploy` を使用する

## エラーハンドリング

- UI: sonner トースト + Skeleton
- API: 統一レスポンス形式 { error: { code, message } }

## コミット規約

Conventional Commits: `type(scope): description`
type: feat, fix, docs, style, refactor, test, chore

## 禁止事項

- `any` 型、`console.log` のコミット、インラインスタイル、CSS Modules
- Redux / Zustand / Jotai 等の状態管理ライブラリ
- `pages/` ディレクトリ、`getServerSideProps` / `getStaticProps`
- `tailwind.config` でのカラー定義（globals.css の CSS変数を使う）
- HSL でのカラー定義（OKLCH を使う）
