import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 保存プラン取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params

    const plan = await prisma.geniePlan.findFirst({
      where: {
        id,
        coupleId: session.id,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'プランが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Wedding Genie plan GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

// プラン更新
const updatePlanSchema = z.object({
  planName: z.string().optional(),
  planData: z.any().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const data = updatePlanSchema.parse(body)

    const plan = await prisma.geniePlan.updateMany({
      where: {
        id,
        coupleId: session.id,
      },
      data: {
        ...(data.planName !== undefined && { planName: data.planName }),
        ...(data.planData !== undefined && { planData: data.planData }),
      },
    })

    if (plan.count === 0) {
      return NextResponse.json(
        { error: 'プランが見つかりません' },
        { status: 404 }
      )
    }

    const updatedPlan = await prisma.geniePlan.findUnique({
      where: { id },
    })

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Wedding Genie plan PATCH error:', error)
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    )
  }
}

// プラン削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params

    const plan = await prisma.geniePlan.deleteMany({
      where: {
        id,
        coupleId: session.id,
      },
    })

    if (plan.count === 0) {
      return NextResponse.json(
        { error: 'プランが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wedding Genie plan DELETE error:', error)
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    )
  }
}
