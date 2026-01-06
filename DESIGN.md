# 結婚式ベンダーマーケットプレイス 設計書

## 1. 画面一覧とURL設計

### 1.1 カップル側（/couple/*）

| 画面名 | URL | 説明 |
|--------|-----|------|
| トップページ | `/` | カテゴリ一覧、おすすめベンダー |
| ベンダー検索 | `/search` | カテゴリ別検索、フィルタ、ソート |
| ベンダー詳細 | `/vendors/[id]` | プロフィール、価格、問い合わせフォーム |
| お気に入り | `/couple/favorites` | 保存したベンダー一覧 |
| 比較リスト | `/couple/compare` | 同カテゴリ内比較（2-4件） |
| PlanBoard | `/couple/plan` | 結婚式組み立てボード（最重要） |
| 問い合わせ一覧 | `/couple/inquiries` | 送信した問い合わせとスレッド |
| 問い合わせ詳細 | `/couple/inquiries/[id]` | メッセージスレッド表示・返信 |
| ログイン | `/couple/login` | カップルログイン |
| 登録 | `/couple/signup` | カップル新規登録 |

### 1.2 ベンダー側（/vendor/*）

| 画面名 | URL | 説明 |
|--------|-----|------|
| ダッシュボード | `/vendor/dashboard` | 問い合わせ数、成約状況 |
| プロフィール編集 | `/vendor/profile` | 基本情報、ギャラリー、価格設定 |
| 問い合わせ一覧 | `/vendor/inquiries` | 受信した問い合わせ一覧 |
| 問い合わせ詳細 | `/vendor/inquiries/[id]` | スレッド表示・返信 |
| 予約可能日設定 | `/vendor/availability` | カレンダー設定（簡易版） |
| ログイン | `/vendor/login` | ベンダーログイン |
| 登録 | `/vendor/signup` | ベンダー新規登録（承認待ち） |

### 1.3 管理者側（/admin/*）

| 画面名 | URL | 説明 |
|--------|-----|------|
| ダッシュボード | `/admin/dashboard` | 全体統計 |
| ベンダー審査 | `/admin/vendors/pending` | 承認待ちベンダー一覧 |
| ベンダー管理 | `/admin/vendors` | 全ベンダー一覧、表示停止 |
| 問い合わせ監視 | `/admin/inquiries` | 全問い合わせ閲覧 |
| 問い合わせ詳細 | `/admin/inquiries/[id]` | 介入・コメント追加 |

## 2. DBスキーマ（Prisma）

Prismaスキーマは `prisma/schema.prisma` に定義済み。

主要モデル：
- Category（カテゴリマスタ）
- Couple（カップル）
- Vendor（ベンダー）
- VendorProfile（ベンダープロフィール詳細）
- VendorGallery（ベンダーギャラリー）
- Admin（管理者）
- Inquiry（問い合わせ）
- ThreadMessage（スレッドメッセージ）
- PlanBoard（結婚式組み立てボード）
- PlanBoardSlot（カテゴリごとの選択状態）
- PlanBoardCandidate（候補ベンダー）
- Favorite（お気に入り）
- Review（レビュー）

## 3. API設計（Next.js Route Handlers）

### 3.1 認証API

```
POST /api/auth/couple/login
POST /api/auth/couple/signup
POST /api/auth/vendor/login
POST /api/auth/vendor/signup
POST /api/auth/admin/login
POST /api/auth/logout
GET  /api/auth/me
```

### 3.2 ベンダー検索API（カップル側）

```
GET  /api/vendors
  Query: category_id, area, price_min, price_max, style_tags[], sort, page, limit
GET  /api/vendors/[id]
GET  /api/vendors/[id]/gallery
POST /api/favorites
DELETE /api/favorites/[vendor_id]
GET  /api/favorites
```

### 3.3 問い合わせAPI

```
POST /api/inquiries
  Body: { vendor_id, category_id, message, wedding_date, area, guest_count, budget_range }
GET  /api/inquiries
GET  /api/inquiries/[id]
POST /api/inquiries/[id]/messages
PATCH /api/inquiries/[id]/status
```

### 3.4 PlanBoard API

```
GET  /api/plan-board
POST /api/plan-board
PATCH /api/plan-board
POST /api/plan-board/slots/[slot_id]/candidates
PATCH /api/plan-board/slots/[slot_id]
  Body: { state, selected_vendor_id, estimated_cost, note }
GET  /api/plan-board/summary
```

### 3.5 ベンダー側API

```
GET  /api/vendor/profile
PATCH /api/vendor/profile
POST /api/vendor/gallery
DELETE /api/vendor/gallery/[id]
GET  /api/vendor/inquiries
GET  /api/vendor/inquiries/[id]
POST /api/vendor/inquiries/[id]/messages
PATCH /api/vendor/inquiries/[id]/status
```

### 3.6 管理者API

```
GET  /api/admin/vendors/pending
PATCH /api/admin/vendors/[id]/approve
PATCH /api/admin/vendors/[id]/reject
PATCH /api/admin/vendors/[id]/suspend
GET  /api/admin/inquiries
GET  /api/admin/inquiries/[id]
POST /api/admin/inquiries/[id]/messages
```

## 4. 重要な状態遷移

### 4.1 問い合わせステータス

```
new (新規)
  ↓
proposing (提案中) - ベンダーが返信
  ↓
contracted (成約) - カップルが決定
  ↓
completed (完了) - 式終了後
  OR
declined (辞退) - どちらかが辞退
```

### 4.2 PlanBoardスロット状態

```
unselected (未選択)
  ↓
candidate (候補) - ベンダーをお気に入り/比較リストから追加
  ↓
selected (決定) - 1つのベンダーを選択
```

### 4.3 ベンダーステータス

```
pending (承認待ち)
  ↓
approved (承認済み) - 管理者が承認
  OR
rejected (否認) - 管理者が否認
  ↓
suspended (表示停止) - 運営判断で一時停止
```

## 5. 必須機能と後回し機能

### 5.1 必須機能（Phase 1）

**カップル側**
- ✅ ベンダー検索・フィルタ・ソート
- ✅ ベンダー詳細表示
- ✅ お気に入り登録
- ✅ 比較リスト（同カテゴリ2-4件）
- ✅ 問い合わせ送信
- ✅ 問い合わせスレッド閲覧・返信
- ✅ PlanBoard（カテゴリ枠管理、状態遷移、予算集計）

**ベンダー側**
- ✅ 登録（承認待ち）
- ✅ プロフィール編集（基本情報、カテゴリ、エリア、価格、ギャラリー）
- ✅ 問い合わせ受信・返信
- ✅ 問い合わせステータス管理

**管理者側**
- ✅ ベンダー承認/否認
- ✅ ベンダー表示停止
- ✅ 問い合わせ監視・閲覧

### 5.2 後回し機能（Phase 2以降）

- レビュー・評価システム
- 予約可能日カレンダー（Google連携）
- 当日TODO管理
- 打合せメモ
- 必要事項アラート
- SNSログイン
- 本人確認（KYC）
- 決済機能
- 通知システム（メール/SMS）
- 統計・レポート
- デイオブプランナー必須化機能
- 当日スタッフ手配管理
