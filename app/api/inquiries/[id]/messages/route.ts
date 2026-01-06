import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createMessageSchema = z.object({
  body: z.string().min(1),
  attachments: z.array(z.string()).optional(),
})

export async function POST(
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
    const data = createMessageSchema.parse(body)

    // 問い合わせの存在と権限チェック
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    })

    if (!inquiry) {
      return NextResponse.json(
        { error: '問い合わせが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック（管理者は全問い合わせに返信可能）
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

    // メッセージ作成
    const message = await prisma.threadMessage.create({
      data: {
        inquiryId: id,
        senderType: session.type,
        senderId: session.id,
        body: data.body,
        attachments: data.attachments || [],
      },
    })

    // 問い合わせステータスを更新（ベンダーが返信した場合）
    if (session.type === 'vendor' && inquiry.status === 'new') {
      await prisma.inquiry.update({
        where: { id },
        data: { status: 'proposing' },
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Message creation error:', error)
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    )
  }
}
