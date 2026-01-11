import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const addCandidateSchema = z.object({
  vendorId: z.string().uuid(),
  profileId: z.string().uuid().optional(),
})

export async function POST(
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
    // ユニーク制約: (planBoardSlotId, vendorId, profileId)
    const existingCandidate = await prisma.planBoardCandidate.findFirst({
      where: {
        planBoardSlotId: slotId,
        vendorId: data.vendorId,
        profileId: data.profileId || null,
      },
    })
    
    if (existingCandidate) {
      return NextResponse.json({
        success: true,
        candidate: existingCandidate,
        message: '既に候補として登録されています',
      })
    }
    
    const candidateData = await prisma.planBoardCandidate.create({
      data: {
        planBoardSlotId: slotId,
        vendorId: data.vendorId,
        profileId: data.profileId || null,
        source: 'manual',
      },
      include: {
        vendor: true,
        profile: true,
      },
    })

    // スロットの状態をcandidateに更新（まだunselectedの場合）
    if (slot.state === 'unselected') {
      await prisma.planBoardSlot.update({
        where: { id: slotId },
        data: { state: 'candidate' },
      })
    }

    return NextResponse.json({ candidate: candidateData })
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
        { error: 'ログインしてください' },
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

    // 候補を削除（profileIdも考慮）
    const { searchParams: deleteParams } = new URL(request.url)
    const profileId = deleteParams.get('profileId')
    
    const candidate = await prisma.planBoardCandidate.findFirst({
      where: {
        planBoardSlotId: slotId,
        vendorId: vendorId,
        profileId: profileId || null,
      },
    })
    
    if (!candidate) {
      return NextResponse.json(
        { error: '候補が見つかりません' },
        { status: 404 }
      )
    }
    
    await prisma.planBoardCandidate.delete({
      where: {
        id: candidate.id,
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

