import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Transaction mode (pgbouncer) を使用する場合、準備されたステートメントを無効化
const connectionUrl = process.env.DATABASE_URL || ''
const isPooler = connectionUrl.includes('pooler.supabase.com') || connectionUrl.includes('pgbouncer=true')

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        // 接続プーラーを使用している場合、?pgbouncer=true を追加（まだない場合）
        url: isPooler && !connectionUrl.includes('pgbouncer=true')
          ? `${connectionUrl}${connectionUrl.includes('?') ? '&' : '?'}pgbouncer=true`
          : connectionUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 接続プールのタイムアウトを延長するための設定
// グレースフルシャットダウン
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
