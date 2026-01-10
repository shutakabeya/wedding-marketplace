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

    // 既存の候補を一度に取得
    const existingCandidates = await prisma.planBoardCandidate.findMany({
      where: {
        planBoardSlotId: { in: existingSlots.map((s) => s.id) },
      },
    })
    const existingCandidatesMap = new Map<string, Set<string>>()
    for (const candidate of existingCandidates) {
      if (!existingCandidatesMap.has(candidate.planBoardSlotId)) {
        existingCandidatesMap.set(candidate.planBoardSlotId, new Set())
      }
      existingCandidatesMap.get(candidate.planBoardSlotId)!.add(candidate.vendorId)
    }

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
    const candidatesToCreate: Array<{
      planBoardSlotId: string
      vendorId: string
      source: string
    }> = []
    const categorySlotData = new Map<
      string,
      {
        state: string
        selectedVendorId: string | null
        selectedProfileId: string | null
        estimatedCost: number | null
        vendorIds: string[]
      }
    >()

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

      // 会場カテゴリの場合
      if (category.name === '会場') {
        const venueIds = [
          planData.venue.selectedVenueId,
          ...planData.venue.alternativeVenueIds,
        ]

        if (existingSlot) {
          slotsToUpdate.push({
            id: existingSlot.id,
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
          })
          categorySlotData.set(category.id, {
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
            vendorIds: venueIds,
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
          categorySlotData.set(category.id, {
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
            vendorIds: venueIds,
          })
        }
        continue
      }

      // その他のカテゴリ
      if (shouldSkip) {
        if (existingSlot) {
          slotsToUpdate.push({
            id: existingSlot.id,
            state: 'skipped',
            selectedVendorId: null,
            selectedProfileId: null,
            estimatedCost: null,
          })
        } else {
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

      // genieプラン登録時はcandidatesを登録しない（selectedVendorのみ）
      // candidatesは手動でベンダーを検索・追加する場合にのみ使用
      if (existingSlot) {
        slotsToUpdate.push({
          id: existingSlot.id,
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
          selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
        })
        categorySlotData.set(category.id, {
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
          selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
          // genieプラン登録時はcandidatesを登録しない
          vendorIds: [],
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
        categorySlotData.set(category.id, {
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
          selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
          // genieプラン登録時はcandidatesを登録しない
          vendorIds: [],
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

      // すべてのスロットIDをマッピング（既存 + 新規作成）
      const allSlotsMap = new Map<string, string>()
      for (const slot of existingSlots) {
        allSlotsMap.set(slot.categoryId, slot.id)
      }
      for (const slot of createdSlots) {
        allSlotsMap.set(slot.categoryId, slot.id)
      }

      // 候補を作成
      for (const [categoryId, slotData] of categorySlotData.entries()) {
        const slotId = allSlotsMap.get(categoryId)
        if (!slotId) continue

        const existingVendorIds = existingCandidatesMap.get(slotId) || new Set()
        for (const vendorId of slotData.vendorIds) {
          if (!existingVendorIds.has(vendorId)) {
            candidatesToCreate.push({
              planBoardSlotId: slotId,
              vendorId,
              source: 'genie',
            })
          }
        }
      }

      if (candidatesToCreate.length > 0) {
        await tx.planBoardCandidate.createMany({
          data: candidatesToCreate,
          skipDuplicates: true,
        })
      }
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
