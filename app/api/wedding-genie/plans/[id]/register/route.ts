import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PlanResult } from '@/lib/wedding-genie'

// PlanBoardに登録
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 保存プランを取得
    const geniePlan = await prisma.geniePlan.findFirst({
      where: {
        id,
        coupleId: session.id,
      },
    })

    if (!geniePlan) {
      return NextResponse.json(
        { error: 'プランが見つかりません' },
        { status: 404 }
      )
    }

    const planData = geniePlan.planData as unknown as PlanResult
    const inputSnapshot = geniePlan.inputSnapshot as any

    // PlanBoardを取得または作成
    let planBoard = await prisma.planBoard.findUnique({
      where: { coupleId: session.id },
    })

    if (!planBoard) {
      planBoard = await prisma.planBoard.create({
        data: {
          coupleId: session.id,
          venueArea: inputSnapshot.area,
          guestCount: inputSnapshot.guestCount,
        },
      })
    } else {
      // 既存のPlanBoardを更新
      planBoard = await prisma.planBoard.update({
        where: { id: planBoard.id },
        data: {
          venueArea: inputSnapshot.area,
          guestCount: inputSnapshot.guestCount,
        },
      })
    }

    // 全カテゴリを取得
    const allCategories = await prisma.category.findMany()

    // 既存のスロットを一度に取得
    const existingSlots = await prisma.planBoardSlot.findMany({
      where: { planBoardId: planBoard.id },
    })
    const existingSlotsMap = new Map(
      existingSlots.map((slot) => [slot.categoryId, slot])
    )

    // candidates機能は削除、selectedVendorのみ使用

    // バッチ処理用のデータを準備
    const slotsToCreate: Array<{
      planBoardId: string
      categoryId: string
      state: string
      selectedVendorId: string | null
      selectedProfileId: string | null
      estimatedCost: number | null
    }> = []
    const slotsToUpdate: Array<{
      id: string
      state: string
      selectedVendorId: string | null
      selectedProfileId: string | null
      estimatedCost: number | null
    }> = []
    // candidates機能は削除、selectedVendorのみ使用

    // 各カテゴリのスロットデータを準備
    for (const category of allCategories) {
      const isExcluded = inputSnapshot.excludedCategories?.includes(category.name)
      const isPlannerCategory = ['プランナー', 'デイオブプランナー'].includes(category.name)
      const shouldSkip =
        isExcluded ||
        (isPlannerCategory &&
          ((inputSnapshot.plannerType === 'planner' && category.name === 'デイオブプランナー') ||
            (inputSnapshot.plannerType === 'day_of' && category.name === 'プランナー') ||
            inputSnapshot.plannerType === 'self'))

      const existingSlot = existingSlotsMap.get(category.id)

      // 既存のスロットが'selected'または'candidate'状態の場合は上書きしない（追加形式）
      if (existingSlot && (existingSlot.state === 'selected' || existingSlot.state === 'candidate')) {
        continue // 既存の決定済みまたは候補状態のスロットは保持
      }

      // 会場カテゴリの場合
      if (category.name === '会場') {
        if (existingSlot) {
          // 既存のスロットが'unselected'または'skipped'の場合のみ更新
          slotsToUpdate.push({
            id: existingSlot.id,
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
          })
        } else {
          slotsToCreate.push({
            planBoardId: planBoard.id,
            categoryId: category.id,
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
          })
        }
        continue
      }

      // その他のカテゴリ
      if (shouldSkip) {
        // skipped状態は既存のselected/candidateを上書きしないため、unselectedの場合のみ更新
        if (existingSlot && existingSlot.state === 'unselected') {
          slotsToUpdate.push({
            id: existingSlot.id,
            state: 'skipped',
            selectedVendorId: null,
            selectedProfileId: null,
            estimatedCost: null,
          })
        } else if (!existingSlot) {
          slotsToCreate.push({
            planBoardId: planBoard.id,
            categoryId: category.id,
            state: 'skipped',
            selectedVendorId: null,
            selectedProfileId: null,
            estimatedCost: null,
          })
        }
        continue
      }

      const allocation = planData.categoryAllocations.find(
        (a) => a.categoryId === category.id
      )
      const vendors = planData.categoryVendorCandidates[category.id] || []
      const selectedVendor = vendors[0]

      // selectedVendorのみ使用（candidates機能は削除）
      // 既存のスロットが'unselected'または'skipped'の場合のみ更新
      if (existingSlot) {
        slotsToUpdate.push({
          id: existingSlot.id,
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
          selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
        })
      } else {
        slotsToCreate.push({
          planBoardId: planBoard.id,
          categoryId: category.id,
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
          selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
        })
      }
    }

    // トランザクションで一括処理
    await prisma.$transaction(async (tx) => {
      // スロットを作成
      const createdSlots = await Promise.all(
        slotsToCreate.map((slotData) =>
          tx.planBoardSlot.create({
            data: slotData,
          })
        )
      )

      // スロットを更新
      if (slotsToUpdate.length > 0) {
        await Promise.all(
          slotsToUpdate.map((slotData) =>
            tx.planBoardSlot.update({
              where: { id: slotData.id },
              data: {
                state: slotData.state,
                selectedVendorId: slotData.selectedVendorId,
                selectedProfileId: slotData.selectedProfileId,
                estimatedCost: slotData.estimatedCost,
              },
            })
          )
        )
      }

      // candidates機能は削除、selectedVendorのみ使用
    })

    return NextResponse.json({
      success: true,
      planBoardId: planBoard.id,
    })
  } catch (error) {
    console.error('Wedding Genie register error:', error)
    return NextResponse.json(
      { error: 'PlanBoard登録に失敗しました' },
      { status: 500 }
    )
  }
}
