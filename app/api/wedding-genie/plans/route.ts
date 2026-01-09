import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 保存プラン一覧取得
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const plans = await prisma.geniePlan.findMany({
      where: { coupleId: session.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Wedding Genie plans GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

// プランを保存
const savePlanSchema = z.object({
  planName: z.string().optional(),
  inputSnapshot: z.any(),
  planData: z.any(),
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
    const data = savePlanSchema.parse(body)

    const plan = await prisma.geniePlan.create({
      data: {
        coupleId: session.id,
        planName: data.planName,
        inputSnapshot: data.inputSnapshot,
        planData: data.planData,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Wedding Genie plans POST error:', error)
    return NextResponse.json(
      { error: '保存に失敗しました' },
      { status: 500 }
    )
  }
}
