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

    const vendors = await prisma.vendor.findMany({
      where: { status: 'pending' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Pending vendors GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}
