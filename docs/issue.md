# GitHub Issue 計画

このファイルを元に GitHub Issue を作成する。
仕様は docs/spec.md、ユーザーストーリーは docs/user-stories.md を参照。

---

## Phase 構成

| Phase | 内容 | Issue 数 |
|-------|------|---------|
| Phase 0 | 環境構築 | 7 |
| Phase 1 | 基盤・ドキュメント | 3 |
| Phase 2 | コア機能 | 11 |
| Phase 3 | 拡張機能 | 8 |
| Phase 4 | UX・運用機能 | 12 |
| **合計** | | **41** |

---

## Labels

### Phase ラベル

| Label | Color |
|-------|-------|
| `phase:0` | `#6B7280` |
| `phase:1` | `#3B82F6` |
| `phase:2` | `#10B981` |
| `phase:3` | `#F59E0B` |
| `phase:4` | `#EF4444` |

### Priority ラベル

| Label | Color |
|-------|-------|
| `priority:high` | `#DC2626` |
| `priority:medium` | `#F59E0B` |
| `priority:low` | `#6B7280` |

### Type ラベル

| Label | Color | 説明 |
|-------|-------|------|
| `type:frontend` | `#3B82F6` | UI・コンポーネント・画面 |
| `type:backend` | `#10B981` | API・DB・Server Actions |
| `type:fullstack` | `#8B5CF6` | フロントエンドとバックエンド両方 |
| `type:infra` | `#78716C` | 環境構築・設定 |
| `type:docs` | `#0EA5E9` | ドキュメント |

### Size ラベル

| Label | Color | 説明 |
|-------|-------|------|
| `size:XS` | `#D1D5DB` | 1〜2 ACU |
| `size:S` | `#93C5FD` | 3〜5 ACU |
| `size:M` | `#6EE7B7` | 5〜8 ACU |
| `size:L` | `#FCA5A5` | 8〜10 ACU（1セッション上限） |

---

## Phase 0: 環境構築（#1〜#7）

| # | タイトル | Labels |
|---|---------|--------|
| 1 | 環境構築（Docker Compose, Next.js 16, PostgreSQL, Prisma, shadcn/ui） | `phase:0`, `priority:high`, `type:infra` |
| 2 | globals.css カラー定義（OKLCH + @theme inline） | `phase:0`, `priority:high`, `type:frontend` |
| 3 | Prisma スキーマ + seed データ | `phase:0`, `priority:high`, `type:backend` |
| 4 | Auth.js v5 + 認証画面（ログイン / サインアップ / パスワードリセット / proxy.ts） | `phase:0`, `priority:high`, `type:fullstack` |
| 5 | レイアウト（サイドバー + ヘッダー + ThemeProvider） | `phase:0`, `priority:high`, `type:frontend` |
| 6 | タスク一覧 + 作成 + カンバン基本表示 | `phase:0`, `priority:high`, `type:fullstack` |
| 7 | OpenAPI 仕様ドラフト | `phase:0`, `priority:high`, `type:docs` |

## Phase 1: 基盤・ドキュメント（#8〜#10）

| # | タイトル | Labels | 対応US | Size |
|---|---------|--------|--------|------|
| 8 | ERD図の作成（Mermaid） | `phase:1`, `priority:high`, `type:docs` | - | `size:XS` |
| 9 | OpenAPI 仕様の完成 | `phase:1`, `priority:high`, `type:docs` | - | `size:S` |
| 10 | プロジェクト CRUD API + UI | `phase:1`, `priority:high`, `type:fullstack` | US-04, US-05, US-06 | `size:M` |

## Phase 2: コア機能（#11〜#21）

| # | タイトル | Labels | 対応US | Size |
|---|---------|--------|--------|------|
| 11 | プロジェクトメンバー招待 | `phase:2`, `priority:high`, `type:fullstack` | US-07 | `size:M` |
| 12 | プロジェクトメンバー権限管理 | `phase:2`, `priority:high`, `type:fullstack` | US-08 | `size:S` |
| 13 | タスク詳細画面 | `phase:2`, `priority:high`, `type:fullstack` | US-10 | `size:M` |
| 14 | タスクのインライン編集 | `phase:2`, `priority:high`, `type:frontend` | US-10 | `size:S` |
| 15 | タスク削除 | `phase:2`, `priority:medium`, `type:fullstack` | US-11 | `size:XS` |
| 16 | サブタスク機能 | `phase:2`, `priority:medium`, `type:fullstack` | US-12 | `size:M` |
| 17 | カンバンボード D&D | `phase:2`, `priority:high`, `type:frontend` | US-14 | `size:L` |
| 18 | カンバン クイック作成 | `phase:2`, `priority:medium`, `type:fullstack` | US-15 | `size:XS` |
| 19 | タスク一覧（リストビュー）完成 | `phase:2`, `priority:high`, `type:frontend` | US-16 | `size:M` |
| 20 | カテゴリ/ラベル管理 | `phase:2`, `priority:medium`, `type:fullstack` | US-20 | `size:S` |
| 21 | タスクへのカテゴリ付与 + フィルタリング | `phase:2`, `priority:medium`, `type:fullstack` | US-20 | `size:M` |

## Phase 3: 拡張機能（#22〜#29）

| # | タイトル | Labels | 対応US | Size |
|---|---------|--------|--------|------|
| 22 | コメント機能（CRUD） | `phase:3`, `priority:high`, `type:fullstack` | US-19 | `size:M` |
| 23 | コメント @メンション | `phase:3`, `priority:medium`, `type:fullstack` | US-19 | `size:M` |
| 24 | ファイル添付機能 | `phase:3`, `priority:medium`, `type:fullstack` | US-21 | `size:L` |
| 25 | グローバル検索 | `phase:3`, `priority:high`, `type:fullstack` | US-22 | `size:M` |
| 26 | 検索フィルター | `phase:3`, `priority:medium`, `type:frontend` | US-22 | `size:S` |
| 27 | アクティビティログ（タスク） | `phase:3`, `priority:medium`, `type:fullstack` | US-23 | `size:M` |
| 28 | アクティビティフィード（プロジェクト） | `phase:3`, `priority:medium`, `type:fullstack` | US-24 | `size:S` |
| 29 | ダッシュボード（サマリーカード + タスク一覧） | `phase:3`, `priority:high`, `type:fullstack` | US-18 | `size:M` |

## Phase 4: UX・運用機能（#30〜#41）

| # | タイトル | Labels | 対応US | Size |
|---|---------|--------|--------|------|
| 30 | ダッシュボード（グラフ + アクティビティフィード） | `phase:4`, `priority:high`, `type:frontend` | US-18 | `size:M` |
| 31 | ガントチャート（基本表示） | `phase:4`, `priority:medium`, `type:frontend` | US-17 | `size:L` |
| 32 | ガントチャート（インタラクション + グルーピング） | `phase:4`, `priority:medium`, `type:frontend` | US-17 | `size:M` |
| 33 | アプリ内通知（API + ベルアイコン + 通知一覧） | `phase:4`, `priority:high`, `type:fullstack` | US-25 | `size:L` |
| 34 | 通知の既読管理（既読/未読切替 + 一括既読） | `phase:4`, `priority:medium`, `type:fullstack` | US-25 | `size:S` |
| 35 | メール通知（Resend） | `phase:4`, `priority:medium`, `type:backend` | US-26 | `size:M` |
| 36 | 多言語対応セットアップ + 認証・レイアウト翻訳 | `phase:4`, `priority:medium`, `type:fullstack` | US-27 | `size:M` |
| 37 | 多言語対応（残りの全画面翻訳） | `phase:4`, `priority:medium`, `type:frontend` | US-27 | `size:M` |
| 38 | ダークモード | `phase:4`, `priority:medium`, `type:frontend` | US-28 | `size:S` |
| 39 | 監査ログ（管理者画面） | `phase:4`, `priority:low`, `type:fullstack` | US-29 | `size:M` |
| 40 | プロフィール設定画面 | `phase:4`, `priority:medium`, `type:fullstack` | US-30 | `size:S` |
| 41 | OpenAPI 仕様の最終同期 | `phase:4`, `priority:medium`, `type:docs` | - | `size:S` |

---

## Issue 本文テンプレート

```markdown
## 概要
[1〜2文で何をするか]

## 対応ユーザーストーリー
[US-XX（docs/user-stories.md 参照）。該当なしの場合は省略]

## Acceptance Criteria
- [ ] [具体的な完了条件1]
- [ ] [具体的な完了条件2]
- [ ] ...

## 技術的な参考情報
- [関連ファイルパス、ドキュメントリンク、API エンドポイント等]
- 仕様書: docs/spec.md
- コーディング規約: .windsurf/rules/coding-rule.md
```

---

## Issue テンプレート例

### 例: Issue #8 ERD図の作成（Mermaid）

**概要**
DB設計を可視化するERD図を Mermaid 形式で作成し、docs/erd.md に配置する。

**Acceptance Criteria**
- [ ] Mermaid の erDiagram 構文で全11テーブルのERD図を作成
- [ ] テーブル間のリレーション（1:N、N:N）を正確に表現
- [ ] 各テーブルの主要カラム（PK、FK、重要フィールド）を記載
- [ ] docs/erd.md に配置し、README.md からリンク
- [ ] GitHub上でMermaidがレンダリングされることを確認

**技術的な参考情報**
- Prisma スキーマ: prisma/schema.prisma
- DB設計: docs/spec.md の「DB設計」セクション
- Mermaid erDiagram: https://mermaid.js.org/syntax/entityRelationshipDiagram.html

**Close issue**
- #7

### 例: Issue #17 カンバンボード D&D

**概要**
カンバンボード画面（/projects/[id]/board）にドラッグ＆ドロップ機能を実装する。

**対応ユーザーストーリー**: US-14（docs/user-stories.md 参照）

**Acceptance Criteria**
- [ ] @dnd-kit/core + @dnd-kit/sortable を使用
- [ ] カラム間 D&D でステータス更新（PATCH /api/tasks/[taskId]/status）
- [ ] カラム内 D&D で並び順更新（PATCH /api/tasks/[taskId]/sort）
- [ ] ドラッグ中にドロップ先がハイライト
- [ ] 楽観的更新（Optimistic Update）で即座にUI反映
- [ ] ステータス変更時にアクティビティログ記録
- [ ] OpenAPI 仕様（docs/openapi.yaml）に準拠

**技術的な参考情報**
- 既存タスクカード: src/components/tasks/TaskCard.tsx
- API パターン: src/app/api/tasks/ の既存実装を参照
- 仕様書: docs/spec.md の「F04: カンバンボード」セクション

**Close issue**
- #16

---

## トレーサビリティマトリクス

| 機能 | ユーザーストーリー | 画面 | API | Issue |
|------|------------------|------|-----|-------|
| F01 認証 | US-01〜03 | #1〜3 | auth/* | #4 |
| F02 プロジェクト | US-04〜08 | #5〜6, #11 | projects/* | #10, #11, #12 |
| F03 タスクCRUD | US-09〜12 | #7〜8, #10 | tasks/* | #6, #13〜16 |
| F04 カンバン | US-13〜15 | #7 | tasks/*/status, sort | #6, #17, #18 |
| F05 リスト | US-16 | #8 | projects/*/tasks | #19 |
| F06 ガント | US-17 | #9 | tasks/* | #31, #32 |
| F07 ダッシュボード | US-18 | #4 | dashboard | #29, #30 |
| F08 コメント | US-19 | #10 | comments/* | #22, #23 |
| F09 カテゴリ | US-20 | #11 | categories/* | #20, #21 |
| F10 添付 | US-21 | #10 | attachments/* | #24 |
| F11 検索 | US-22 | 全画面ヘッダー | search | #25, #26 |
| F12 アクティビティ | US-23〜24 | #10, ダッシュボード | activities | #27, #28 |
| F13 通知 | US-25〜26 | #13 | notifications/* | #33, #34, #35 |
| F14 i18n | US-27 | 全画面 | users/me | #36, #37 |
| F15 ダークモード | US-28 | 全画面 | users/me | #38 |
| F16 監査ログ | US-29 | #15 | admin/audit-logs | #39 |
| F17 ユーザー | US-08, US-30 | #12, #14 | users/me, members/* | #12, #40 |
| - OpenAPI 同期 | - | - | docs/openapi.yaml | #41 |
