import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateSlotSchema = z.object({
  state: z.enum(['unselected', 'candidate', 'selected', 'skipped']).optional(),
  selectedVendorId: z.string().uuid().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  note: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { slotId } = await params
    const body = await request.json()
    const data = updateSlotSchema.parse(body)

    // スロットがカップルのPlanBoardに属しているか確認
    const slot = await prisma.planBoardSlot.findUnique({
      where: { id: slotId },
      include: {
        planBoard: true,
      },
    })

    if (!slot || slot.planBoard.coupleId !== session.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const updatedSlotData = await prisma.planBoardSlot.update({
      where: { id: slotId },
      data: {
        state: data.state,
        selectedVendorId: data.selectedVendorId,
        estimatedCost: data.estimatedCost,
        note: data.note,
      },
      include: {
        category: true,
        selectedVendor: {
          include: {
            profiles: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        candidates: {
          include: {
            vendor: {
              include: {
                profiles: {
                  where: { isDefault: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const updatedSlot = {
      ...updatedSlotData,
      selectedVendor: updatedSlotData.selectedVendor
        ? {
            ...updatedSlotData.selectedVendor,
            profile: updatedSlotData.selectedVendor.profiles[0] || null,
          }
        : null,
      candidates: updatedSlotData.candidates.map((candidate: any) => ({
        ...candidate,
        vendor: {
          ...candidate.vendor,
          profile: candidate.vendor.profiles[0] || null,
        },
      })),
    }

    return NextResponse.json({ slot: updatedSlot })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PlanBoardSlot PATCH error:', error)
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    )
  }
}
