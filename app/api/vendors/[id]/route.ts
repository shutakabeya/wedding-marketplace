import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vendorData = await prisma.vendor.findUnique({
      where: { id },
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
        gallery: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!vendorData) {
      return NextResponse.json(
        { error: 'ベンダーが見つかりません' },
        { status: 404 }
      )
    }

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const vendor = {
      ...vendorData,
      profile: vendorData.profiles[0] || null,
    }

    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Vendor detail error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}
