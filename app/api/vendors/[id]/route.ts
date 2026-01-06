import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vendor = await prisma.vendor.findUnique({
      where: { id, status: 'approved' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        profile: true,
        gallery: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'ベンダーが見つかりません' },
        { status: 404 }
      )
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
