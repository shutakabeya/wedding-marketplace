import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateSlotSchema = z.object({
  state: z.enum(['unselected', 'candidate', 'selected', 'skipped']).optional(),
  selectedVendorId: z.string().uuid().optional().nullable(),
  selectedProfileId: z.string().uuid().optional().nullable(),
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
        { error: 'ログインしてください' },
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

      // candidates機能は削除されたため、candidatesの削除処理は不要

      const updatedSlotData = await prisma.planBoardSlot.update({
      where: { id: slotId },
      data: {
        state: data.state,
        selectedVendorId: data.selectedVendorId,
        selectedProfileId: data.selectedProfileId,
        estimatedCost: data.estimatedCost,
        note: data.note,
      },
      include: {
        category: true,
          selectedProfile: true,
        selectedVendor: {
          include: {
            profiles: {
              where: { isDefault: true },
              take: 1,
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
            profile: updatedSlotData.selectedProfile || updatedSlotData.selectedVendor.profiles[0] || null,
          }
        : null,
      candidates: [], // candidates機能は削除、selectedVendorのみ使用
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
