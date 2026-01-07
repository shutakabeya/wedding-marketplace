import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Transaction mode (pgbouncer) を使用する場合、準備されたステートメントを無効化
    // 接続文字列に ?pgbouncer=true がある場合、Prismaは自動的に無効化しますが、明示的に設定することもできます
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 接続プールのタイムアウトを延長するための設定
// グレースフルシャットダウン
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
