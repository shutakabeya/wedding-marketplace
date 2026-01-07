import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const vendorsData = await prisma.vendor.findMany({
      where: { status: 'pending' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        profiles: {
          where: { isDefault: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const vendors = vendorsData.map((vendor) => ({
      ...vendor,
      profile: vendor.profiles[0] || null,
    }))

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Pending vendors GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}
