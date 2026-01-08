import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const profileId = searchParams.get('profileId')

    const vendorData = await prisma.vendor.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        profiles: {
          // プロフィールIDが指定されている場合は該当プロフィール、そうでなければデフォルトプロフィール
          where: profileId 
            ? { id: profileId }
            : { isDefault: true },
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

    // プロフィールIDが指定されているが、該当プロフィールが見つからない場合
    if (profileId && vendorData.profiles.length === 0) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      )
    }

    // 指定されたプロフィールまたはデフォルトプロフィールを返す
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
