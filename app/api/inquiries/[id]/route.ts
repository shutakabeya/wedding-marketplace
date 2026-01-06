import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        couple: true,
        vendor: {
          include: {
            profile: true,
          },
        },
        category: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!inquiry) {
      return NextResponse.json(
        { error: '問い合わせが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック（管理者は全問い合わせを閲覧可能）
    if (session.type !== 'admin') {
      if (
        (session.type === 'couple' && inquiry.coupleId !== session.id) ||
        (session.type === 'vendor' && inquiry.vendorId !== session.id)
      ) {
        return NextResponse.json(
          { error: '権限がありません' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Inquiry detail error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

const updateStatusSchema = z.object({
  status: z.enum(['new', 'proposing', 'contracted', 'declined', 'completed']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const data = updateStatusSchema.parse(body)

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    })

    if (!inquiry) {
      return NextResponse.json(
        { error: '問い合わせが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック（管理者は全問い合わせを更新可能）
    if (session.type !== 'admin') {
      if (
        (session.type === 'couple' && inquiry.coupleId !== session.id) ||
        (session.type === 'vendor' && inquiry.vendorId !== session.id)
      ) {
        return NextResponse.json(
          { error: '権限がありません' },
          { status: 403 }
        )
      }
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: data.status },
      include: {
        couple: true,
        vendor: {
          include: {
            profile: true,
          },
        },
        category: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ inquiry: updatedInquiry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Inquiry status update error:', error)
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    )
  }
}
