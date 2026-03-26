# GitHub Issue 計画

このファイルを元に GitHub Issue を作成する。
仕様は docs/spec.md、ユーザーストーリーは docs/user-stories.md を参照。

---

## Phase 構成

| Phase    | 内容               | 担当     | Issue 数 |
| -------- | ------------------ | -------- | -------- |
| Phase 0  | インフラ・基盤     | Windsurf | 7        |
| Phase 1  | 基盤・ドキュメント | Devin    | 3        |
| Phase 2  | コア機能           | Devin    | 10       |
| Phase 3  | 拡張機能           | Devin    | 8        |
| Phase 4  | UX・運用機能       | Devin    | 7        |
| **合計** |                    |          | **35**   |

---

## Labels

### Phase ラベル

| Label     | Color     | 説明               |
| --------- | --------- | ------------------ |
| `phase:0` | `#6B7280` | インフラ・基盤     |
| `phase:1` | `#3B82F6` | 基盤・ドキュメント |
| `phase:2` | `#10B981` | コア機能           |
| `phase:3` | `#F59E0B` | 拡張機能           |
| `phase:4` | `#EF4444` | UX・運用機能       |

### Priority ラベル

| Label             | Color     |
| ----------------- | --------- |
| `priority:high`   | `#DC2626` |
| `priority:medium` | `#F59E0B` |
| `priority:low`    | `#6B7280` |

### Feature ラベル

| Label                  | Color     |
| ---------------------- | --------- |
| `feature:auth`         | `#8B5CF6` |
| `feature:project`      | `#06B6D4` |
| `feature:task`         | `#22C55E` |
| `feature:board`        | `#F97316` |
| `feature:dashboard`    | `#EC4899` |
| `feature:comment`      | `#14B8A6` |
| `feature:search`       | `#A855F7` |
| `feature:notification` | `#EAB308` |
| `feature:i18n`         | `#64748B` |
| `feature:ui`           | `#E11D48` |
| `feature:docs`         | `#0EA5E9` |
| `feature:infra`        | `#78716C` |
| `feature:admin`        | `#BE185D` |

---

## Phase 0: インフラ・基盤（#1〜#7）

※ Windsurf + Opus 4.6 で実装。Devin の「お手本」となるコード。

| #   | タイトル                                                                         | Labels                                      |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | 環境構築（Docker Compose, Next.js 16, PostgreSQL, Prisma, Tailwind CSS v4）      | `phase:0`, `priority:high`, `feature:infra` |
| 2   | globals.css カラー定義（OKLCH + @theme inline）                                  | `phase:0`, `priority:high`, `feature:ui`    |
| 3   | Prisma スキーマ + seed データ                                                    | `phase:0`, `priority:high`, `feature:infra` |
| 4   | Auth.js v5 + 認証画面（ログイン / サインアップ / パスワードリセット / proxy.ts） | `phase:0`, `priority:high`, `feature:auth`  |
| 5   | レイアウト（サイドバー + ヘッダー + ThemeProvider）                              | `phase:0`, `priority:high`, `feature:ui`    |
| 6   | タスク一覧 + 作成 + カンバン基本表示（お手本1機能）                              | `phase:0`, `priority:high`, `feature:task`  |
| 7   | OpenAPI 仕様ドラフト                                                             | `phase:0`, `priority:high`, `feature:docs`  |

## Phase 1: 基盤・ドキュメント（#8〜#10）

| #   | タイトル                   | Labels                                        | 対応US              |
| --- | -------------------------- | --------------------------------------------- | ------------------- |
| 8   | ERD図の作成（Mermaid）     | `phase:1`, `priority:high`, `feature:docs`    | -                   |
| 9   | OpenAPI 仕様の完成         | `phase:1`, `priority:high`, `feature:docs`    | -                   |
| 10  | プロジェクト CRUD API + UI | `phase:1`, `priority:high`, `feature:project` | US-04, US-05, US-06 |

## Phase 2: コア機能（#11〜#20）

| #   | タイトル                                | Labels                                        | 対応US       |
| --- | --------------------------------------- | --------------------------------------------- | ------------ |
| 11  | プロジェクトメンバー管理                | `phase:2`, `priority:high`, `feature:project` | US-07, US-08 |
| 12  | タスク詳細画面                          | `phase:2`, `priority:high`, `feature:task`    | US-10        |
| 13  | タスクのインライン編集                  | `phase:2`, `priority:high`, `feature:task`    | US-10        |
| 14  | タスク削除                              | `phase:2`, `priority:medium`, `feature:task`  | US-11        |
| 15  | サブタスク機能                          | `phase:2`, `priority:medium`, `feature:task`  | US-12        |
| 16  | カンバンボード D&D                      | `phase:2`, `priority:high`, `feature:board`   | US-14        |
| 17  | カンバン クイック作成                   | `phase:2`, `priority:medium`, `feature:board` | US-15        |
| 18  | タスク一覧（リストビュー）完成          | `phase:2`, `priority:high`, `feature:task`    | US-16        |
| 19  | カテゴリ/ラベル管理                     | `phase:2`, `priority:medium`, `feature:task`  | US-20        |
| 20  | タスクへのカテゴリ付与 + フィルタリング | `phase:2`, `priority:medium`, `feature:task`  | US-20        |

## Phase 3: 拡張機能（#21〜#28）

| #   | タイトル                               | Labels                                          | 対応US |
| --- | -------------------------------------- | ----------------------------------------------- | ------ |
| 21  | コメント機能                           | `phase:3`, `priority:high`, `feature:comment`   | US-19  |
| 22  | コメント @メンション                   | `phase:3`, `priority:medium`, `feature:comment` | US-19  |
| 23  | ファイル添付機能                       | `phase:3`, `priority:medium`, `feature:task`    | US-21  |
| 24  | グローバル検索                         | `phase:3`, `priority:high`, `feature:search`    | US-22  |
| 25  | 検索フィルター                         | `phase:3`, `priority:medium`, `feature:search`  | US-22  |
| 26  | アクティビティログ（タスク）           | `phase:3`, `priority:medium`, `feature:task`    | US-23  |
| 27  | アクティビティフィード（プロジェクト） | `phase:3`, `priority:medium`, `feature:project` | US-24  |
| 28  | ダッシュボード（サマリー + グラフ）    | `phase:3`, `priority:high`, `feature:dashboard` | US-18  |

## Phase 4: UX・運用機能（#29〜#35）

| #   | タイトル                | Labels                                               | 対応US |
| --- | ----------------------- | ---------------------------------------------------- | ------ |
| 29  | ガントチャート          | `phase:4`, `priority:medium`, `feature:task`         | US-17  |
| 30  | アプリ内通知            | `phase:4`, `priority:high`, `feature:notification`   | US-25  |
| 31  | メール通知（Resend）    | `phase:4`, `priority:medium`, `feature:notification` | US-26  |
| 32  | 多言語対応（next-intl） | `phase:4`, `priority:medium`, `feature:i18n`         | US-27  |
| 33  | ダークモード            | `phase:4`, `priority:medium`, `feature:ui`           | US-28  |
| 34  | 監査ログ（管理者画面）  | `phase:4`, `priority:low`, `feature:admin`           | US-29  |
| 35  | プロフィール設定画面    | `phase:4`, `priority:medium`, `feature:ui`           | US-30  |

---

## Issue 本文テンプレート

各 Issue の本文は以下の形式で作成する。

実装時のスコープは、原則として対象Issue本文の「概要」「Acceptance Criteria」「技術的な参考情報」に含まれる内容を基準とする。
`docs/spec.md` や `docs/user-stories.md` は参照資料であり、Issue本文に明記されていない後続機能や将来構成を先回りして実装しない。

```markdown
## 概要

[1〜2文で何をするか]

## 対応ユーザーストーリー

[US-XX（docs/user-stories.md 参照）。Phase 0 等で該当なしの場合は省略]

## Acceptance Criteria

- [ ] [具体的な完了条件1]
- [ ] [具体的な完了条件2]
- [ ] ...

## 技術的な参考情報

- [関連ファイルパス、ドキュメントリンク、API エンドポイント等]
- 仕様書: docs/spec.md
- コーディング規約: .windsurf/rules/coding-conventions.md
```

Acceptance Criteria は docs/spec.md の機能仕様と docs/user-stories.md の AC を組み合わせて記載する。

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

### 例: Issue #16 カンバンボード D&D

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

---

## トレーサビリティマトリクス

| 機能               | ユーザーストーリー | 画面                | API                   | Issue        |
| ------------------ | ------------------ | ------------------- | --------------------- | ------------ |
| F01 認証           | US-01〜03          | #1〜3               | auth/\*               | #4           |
| F02 プロジェクト   | US-04〜08          | #5〜6, #11          | projects/\*           | #10, #11     |
| F03 タスクCRUD     | US-09〜12          | #7〜8, #10          | tasks/\*              | #6, #12〜15  |
| F04 カンバン       | US-13〜15          | #7                  | tasks/\*/status, sort | #6, #16, #17 |
| F05 リスト         | US-16              | #8                  | projects/\*/tasks     | #18          |
| F06 ガント         | US-17              | #9                  | tasks/\*              | #29          |
| F07 ダッシュボード | US-18              | #4                  | dashboard             | #28          |
| F08 コメント       | US-19              | #10                 | comments/\*           | #21, #22     |
| F09 カテゴリ       | US-20              | #11                 | categories/\*         | #19, #20     |
| F10 添付           | US-21              | #10                 | attachments/\*        | #23          |
| F11 検索           | US-22              | 全画面ヘッダー      | search                | #24, #25     |
| F12 アクティビティ | US-23〜24          | #10, ダッシュボード | activities            | #26, #27     |
| F13 通知           | US-25〜26          | #13                 | notifications/\*      | #30, #31     |
| F14 i18n           | US-27              | 全画面              | users/me              | #32          |
| F15 ダークモード   | US-28              | 全画面              | users/me              | #33          |
| F16 監査ログ       | US-29              | #15                 | admin/audit-logs      | #34          |
| F17 ユーザー       | US-08, US-30       | #12, #14            | users/me, members/\*  | #11, #35     |
