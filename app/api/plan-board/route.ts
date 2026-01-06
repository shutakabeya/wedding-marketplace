import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    let planBoard = await prisma.planBoard.findUnique({
      where: { coupleId: session.id },
      include: {
        slots: {
          include: {
            category: true,
            selectedVendor: {
              include: {
                profile: true,
              },
            },
            candidates: {
              include: {
                vendor: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // 存在しない場合は作成
    if (!planBoard) {
      planBoard = await prisma.planBoard.create({
        data: {
          coupleId: session.id,
          slots: {
            create: await Promise.all(
              (await prisma.category.findMany()).map((category: { id: string }) => ({
                categoryId: category.id,
                state: 'unselected',
              }))
            ),
          },
        },
        include: {
          slots: {
            include: {
              category: true,
              selectedVendor: {
                include: {
                  profile: true,
                },
              },
              candidates: {
                include: {
                  vendor: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    // 予算合計計算
    const totalBudget = planBoard.slots.reduce((sum: number, slot: { estimatedCost: number | null }) => {
      return sum + (slot.estimatedCost || 0)
    }, 0)

    return NextResponse.json({
      planBoard,
      totalBudget,
    })
  } catch (error) {
    console.error('PlanBoard GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

const updateSchema = z.object({
  weddingDate: z.string().optional(),
  venueArea: z.string().optional(),
  guestCount: z.number().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const planBoard = await prisma.planBoard.upsert({
      where: { coupleId: session.id },
      update: {
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        venueArea: data.venueArea,
        guestCount: data.guestCount,
      },
      create: {
        coupleId: session.id,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        venueArea: data.venueArea,
        guestCount: data.guestCount,
      },
    })

    return NextResponse.json({ planBoard })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PlanBoard PATCH error:', error)
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    )
  }
}
