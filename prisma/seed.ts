import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 初期データ投入を開始します...')

  // カテゴリマスタ作成
  const categories = [
    { name: '会場', displayOrder: 1 },
    { name: '写真', displayOrder: 2 },
    { name: 'ケータリング', displayOrder: 3 },
    { name: 'ドレス', displayOrder: 4 },
    { name: '引き出物', displayOrder: 5 },
    { name: 'ヘアメイク', displayOrder: 6 },
    { name: 'デイオブプランナー', displayOrder: 7 },
    { name: 'ケーキ', displayOrder: 8 },
    { name: 'スタッフ', displayOrder: 9 },
    { name: 'プランナー', displayOrder: 10 },
    { name: 'MC', displayOrder: 11 },
    { name: '映像', displayOrder: 12 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  console.log('✅ カテゴリマスタを作成しました')

  // 管理者アカウント作成（デフォルト）
  const adminPassword = await hashPassword('admin123')
  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '管理者',
    },
  })

  console.log('✅ 管理者アカウントを作成しました (admin@example.com / admin123)')

  console.log('🎉 初期データ投入が完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
