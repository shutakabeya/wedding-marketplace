import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createInquirySchema = z.object({
  vendorId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  message: z.string(),
  weddingDate: z.string().optional(),
  area: z.string().optional(),
  guestCount: z.number().optional(),
  budgetRangeMin: z.number().optional(),
  budgetRangeMax: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createInquirySchema.parse(body)

    const inquiryData = await prisma.inquiry.create({
      data: {
        coupleId: session.id,
        vendorId: data.vendorId,
        categoryId: data.categoryId,
        message: data.message,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
        area: data.area,
        guestCount: data.guestCount,
        budgetRangeMin: data.budgetRangeMin,
        budgetRangeMax: data.budgetRangeMax,
        status: 'new',
      },
      include: {
        vendor: {
          include: {
            profiles: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        category: true,
      },
    })

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const inquiry = {
      ...inquiryData,
      vendor: {
        ...inquiryData.vendor,
        profile: inquiryData.vendor.profiles[0] || null,
      },
    }

    // 最初のメッセージを作成
    await prisma.threadMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderType: 'couple',
        senderId: session.id,
        body: data.message,
      },
    })

    return NextResponse.json({ inquiry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Inquiry creation error:', error)
    return NextResponse.json(
      { error: '問い合わせの送信に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || session.type

    let where: any = {}
    // 管理者は全問い合わせを閲覧可能
    if (session.type === 'admin') {
      // where条件なし（全件取得）
    } else if (type === 'couple') {
      where.coupleId = session.id
    } else if (type === 'vendor') {
      where.vendorId = session.id
    }

    const inquiriesData = await prisma.inquiry.findMany({
      where,
      include: {
        couple: true,
        vendor: {
          include: {
            profiles: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        category: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const inquiries = inquiriesData.map((inq) => ({
      ...inq,
      vendor: {
        ...inq.vendor,
        profile: inq.vendor.profiles[0] || null,
      },
    }))

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Inquiries fetch error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}
