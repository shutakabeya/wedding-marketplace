import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const addCandidateSchema = z.object({
  vendorId: z.string().uuid(),
})

export async function POST(
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
    const data = addCandidateSchema.parse(body)

    // スロットがカップルのPlanBoardに属しているか確認
    const slot = await prisma.planBoardSlot.findUnique({
      where: { id: slotId },
      include: {
        planBoard: true,
        category: true,
      },
    })

    if (!slot || slot.planBoard.coupleId !== session.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // ベンダーがこのカテゴリに対応しているか確認
    const vendorCategory = await prisma.vendorCategory.findUnique({
      where: {
        vendorId_categoryId: {
          vendorId: data.vendorId,
          categoryId: slot.categoryId,
        },
      },
    })

    if (!vendorCategory) {
      return NextResponse.json(
        { error: 'このベンダーは該当カテゴリに対応していません' },
        { status: 400 }
      )
    }

    // 候補として追加（既に存在する場合はエラーにしない）
    const candidateData = await prisma.planBoardCandidate.upsert({
      where: {
        planBoardSlotId_vendorId: {
          planBoardSlotId: slotId,
          vendorId: data.vendorId,
        },
      },
      create: {
        planBoardSlotId: slotId,
        vendorId: data.vendorId,
      },
      update: {},
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
    })

    // スロットの状態をcandidateに更新（まだunselectedの場合）
    if (slot.state === 'unselected') {
      await prisma.planBoardSlot.update({
        where: { id: slotId },
        data: { state: 'candidate' },
      })
    }

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const candidate = {
      ...candidateData,
      vendor: {
        ...candidateData.vendor,
        profile: candidateData.vendor.profiles[0] || null,
      },
    }

    return NextResponse.json({ candidate })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PlanBoardCandidate POST error:', error)
    return NextResponse.json(
      { error: '候補の追加に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorIdが必要です' },
        { status: 400 }
      )
    }

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

    // 候補を削除
    await prisma.planBoardCandidate.delete({
      where: {
        planBoardSlotId_vendorId: {
          planBoardSlotId: slotId,
          vendorId: vendorId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PlanBoardCandidate DELETE error:', error)
    return NextResponse.json(
      { error: '候補の削除に失敗しました' },
      { status: 500 }
    )
  }
}
