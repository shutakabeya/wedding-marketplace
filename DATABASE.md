# データベース設定とデータ拡充ガイド

## 現在のデータベース設定

このプロジェクトは **PostgreSQL** を使用しています。Prisma ORMを通じてデータベースにアクセスしています。

### 現在の設定

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

環境変数 `DATABASE_URL` で接続先を指定します。

## Supabaseへの移行方法

SupabaseはPostgreSQLベースのBaaS（Backend as a Service）です。現在のPrisma設定をそのまま使用できます。

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から「Database」→「Connection string」を確認

### 2. 接続文字列の取得

Supabaseの接続文字列は以下の形式です：

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

または、接続プーリングを使用する場合：

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. 環境変数の設定

`.env` ファイル（または `.env.local`）に設定：

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 4. マイグレーションの実行

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行（初回）
npx prisma migrate deploy

# または開発環境の場合
npx prisma migrate dev --name init
```

### 5. 初期データの投入

```bash
npm run db:seed
```

## データ拡充の方法

### 方法1: Seedスクリプトを使用（推奨）

既存の `prisma/seed.ts` を拡張して、テストデータを追加できます。

#### 例: ベンダーデータの追加

```typescript
// prisma/seed.ts に追加

// サンプルベンダー作成
const sampleVendors = [
  {
    email: 'venue@example.com',
    passwordHash: await hashPassword('password123'),
    name: '美しい会場',
    bio: '都心の一等地にある結婚式場です。',
    status: 'approved',
    categories: ['会場'],
    profile: {
      areas: ['東京都', '神奈川県'],
      priceMin: 500000,
      priceMax: 2000000,
      styleTags: ['エレガント', 'モダン'],
      services: '挙式・披露宴・二次会',
    },
  },
  // さらに追加...
]

for (const vendorData of sampleVendors) {
  const category = await prisma.category.findUnique({
    where: { name: vendorData.categories[0] },
  })

  const vendor = await prisma.vendor.create({
    data: {
      email: vendorData.email,
      passwordHash: vendorData.passwordHash,
      name: vendorData.name,
      bio: vendorData.bio,
      status: vendorData.status,
      categories: {
        create: {
          categoryId: category!.id,
        },
      },
      profile: {
        create: vendorData.profile,
      },
    },
  })
}
```

実行方法：
```bash
npm run db:seed
```

### 方法2: Prisma Studioを使用（GUI）

Prisma Studioは、データベースを視覚的に管理できるツールです。

```bash
npx prisma studio
```

ブラウザで `http://localhost:5555` が開き、データの追加・編集が可能です。

### 方法3: マイグレーションでデフォルトデータを追加

マイグレーションファイルにSQLを追加して、初期データを投入：

```sql
-- prisma/migrations/XXXXXX_add_initial_data/migration.sql

-- カテゴリの追加
INSERT INTO categories (id, name, display_order, created_at)
VALUES 
  (gen_random_uuid(), '花嫁', 13, NOW()),
  (gen_random_uuid(), '花婿', 14, NOW())
ON CONFLICT (name) DO NOTHING;
```

### 方法4: 管理画面から追加（実装が必要）

将来的に、管理者画面からデータを追加できる機能を実装することも可能です。

#### 実装例: カテゴリ追加API

```typescript
// app/api/admin/categories/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'admin') {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { name, displayOrder } = await request.json()

  const category = await prisma.category.create({
    data: { name, displayOrder },
  })

  return NextResponse.json({ category })
}
```

### 方法5: CSVインポート機能（カスタム実装）

大量のデータをインポートする場合、CSVインポート機能を実装：

```typescript
// app/api/admin/import/route.ts
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'admin') {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const content = await file.text()
  const records = parse(content, { columns: true })

  // データベースに一括挿入
  for (const record of records) {
    await prisma.vendor.create({
      data: {
        email: record.email,
        name: record.name,
        // ...
      },
    })
  }

  return NextResponse.json({ success: true })
}
```

## Supabaseの追加機能

Supabaseを使用する場合、以下の追加機能が利用できます：

### 1. リアルタイム機能

Supabaseのリアルタイム機能を使用して、問い合わせの新着通知などを実装できます。

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 問い合わせの変更を監視
supabase
  .channel('inquiries')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'inquiries' },
    (payload) => {
      console.log('新しい問い合わせ:', payload.new)
    }
  )
  .subscribe()
```

### 2. ストレージ（画像アップロード）

ベンダーギャラリーの画像をSupabase Storageに保存：

```typescript
// 画像アップロード
const { data, error } = await supabase.storage
  .from('vendor-gallery')
  .upload(`${vendorId}/${filename}`, file)

// 公開URL取得
const { data: { publicUrl } } = supabase.storage
  .from('vendor-gallery')
  .getPublicUrl(`${vendorId}/${filename}`)
```

### 3. 認証機能

Supabase Authを使用して、SNSログインなどを実装できます。

## データベースのバックアップ

### Supabaseの場合

1. Supabaseダッシュボード → Settings → Database
2. 「Backups」セクションからバックアップをダウンロード
3. または、自動バックアップが有効（有料プラン）

### ローカルPostgreSQLの場合

```bash
# バックアップ
pg_dump -h localhost -U postgres wedding_marketplace > backup.sql

# 復元
psql -h localhost -U postgres wedding_marketplace < backup.sql
```

## パフォーマンス最適化

### インデックスの追加

よく検索されるカラムにインデックスを追加：

```prisma
model Vendor {
  // ...
  status String @default("pending")
  
  @@index([status])
  @@index([createdAt])
}

model Inquiry {
  // ...
  status String @default("new")
  
  @@index([status])
  @@index([coupleId, status])
  @@index([vendorId, status])
}
```

マイグレーション実行：
```bash
npx prisma migrate dev --name add_indexes
```

## まとめ

- **現在**: PostgreSQL（任意のプロバイダー）
- **Supabase移行**: 接続文字列を変更するだけ
- **データ拡充**: Seedスクリプト、Prisma Studio、管理画面など
- **追加機能**: Supabaseのリアルタイム、ストレージ、認証機能を活用可能

