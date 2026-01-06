# 結婚式ベンダーマーケットプレイス

日本向けの結婚式ベンダーマーケットプレイス（WeddingWire型）の実装です。

## 機能概要

### カップル側
- ベンダー検索・フィルタ・ソート
- ベンダー詳細表示
- 問い合わせ送信・管理
- PlanBoard（結婚式組み立てボード）
- お気に入り・比較リスト（実装予定）

### ベンダー側
- 登録（承認待ち）
- プロフィール編集
- 問い合わせ受信・返信
- 問い合わせステータス管理

### 管理者側
- ベンダー承認/否認
- ベンダー表示停止
- 問い合わせ監視

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下を設定：

```
DATABASE_URL="postgresql://user:password@localhost:5432/wedding_marketplace?schema=public"
```

**Supabaseを使用する場合**: `DATABASE.md` を参照してください。

### 3. データベースのセットアップ

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行
npx prisma migrate dev --name init

# 初期データ投入（カテゴリマスタと管理者アカウント）
npm run db:seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

## データベーススキーマ

詳細は `prisma/schema.prisma` を参照してください。

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

## データベース

データベースの設定、Supabaseへの移行方法、データ拡充方法については `DATABASE.md` を参照してください。

## API設計

詳細は `DESIGN.md` を参照してください。

## 状態遷移

### 問い合わせステータス
- new → proposing → contracted → completed
- または declined

### PlanBoardスロット状態
- unselected → candidate → selected

### ベンダーステータス
- pending → approved / rejected
- approved → suspended

## 今後の実装予定

- レビュー・評価システム
- 予約可能日カレンダー
- 当日TODO管理
- 打合せメモ
- 必要事項アラート
- SNSログイン
- 決済機能
- 通知システム
