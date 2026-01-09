import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generatePlans, type GenieInput } from '@/lib/wedding-genie'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateSchema = z.object({
  area: z.string().min(1),
  guestCount: z.number().int().min(1),
  totalBudget: z.number().int().min(1),
  excludedCategories: z.array(z.string()).optional(),
  priorityCategories: z.array(z.string()).max(2).optional(),
  plannerType: z.enum(['planner', 'day_of', 'self', 'undecided']),
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
    const data = generateSchema.parse(body)

    const input: GenieInput = {
      area: data.area,
      guestCount: data.guestCount,
      totalBudget: data.totalBudget,
      excludedCategories: data.excludedCategories,
      priorityCategories: data.priorityCategories,
      plannerType: data.plannerType,
    }

      const plans = await generatePlans(input)

      // 会場情報を取得
      const venueIds = [
        plans[0].venue.selectedVenueId,
        ...plans[0].venue.alternativeVenueIds,
      ]

      const venues = await prisma.vendor.findMany({
        where: {
          id: { in: venueIds },
        },
        include: {
          profiles: {
            where: {
              id: plans[0].venue.selectedProfileId,
            },
            take: 1,
          },
        },
      })

      const venueInfo = venues.find((v) => v.id === plans[0].venue.selectedVenueId)

      return NextResponse.json({
        plans,
        inputSnapshot: input,
        venueInfo: venueInfo
          ? {
              id: venueInfo.id,
              name: venueInfo.name,
              profileName: venueInfo.profiles[0]?.name || null,
              imageUrl: venueInfo.profiles[0]?.imageUrl || null,
            }
          : null,
      })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Wedding Genie generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'プラン生成に失敗しました' },
      { status: 500 }
    )
  }
}
