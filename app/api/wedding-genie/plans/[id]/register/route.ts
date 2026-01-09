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
        { error: '認証が必要です' },
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

    // 各カテゴリのスロットを作成または更新
    for (const category of allCategories) {
      // カテゴリが除外されている場合はskipped
      const isExcluded = inputSnapshot.excludedCategories?.includes(category.name)
      const isPlannerCategory = ['プランナー', 'デイオブプランナー'].includes(category.name)
      const shouldSkip =
        isExcluded ||
        (isPlannerCategory &&
          ((inputSnapshot.plannerType === 'planner' && category.name === 'デイオブプランナー') ||
            (inputSnapshot.plannerType === 'day_of' && category.name === 'プランナー') ||
            inputSnapshot.plannerType === 'self'))

      // 会場カテゴリの場合
      if (category.name === '会場') {
        const venueSlot = await prisma.planBoardSlot.upsert({
          where: {
            planBoardId_categoryId: {
              planBoardId: planBoard.id,
              categoryId: category.id,
            },
          },
          create: {
            planBoardId: planBoard.id,
            categoryId: category.id,
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
          },
          update: {
            state: 'selected',
            selectedVendorId: planData.venue.selectedVenueId,
            selectedProfileId: planData.venue.selectedProfileId,
            estimatedCost: planData.venue.estimatedPrice.mid,
          },
        })

        // 候補を追加（メイン会場と代替会場）
        const venueIds = [
          planData.venue.selectedVenueId,
          ...planData.venue.alternativeVenueIds,
        ]

        for (const vendorId of venueIds) {
          await prisma.planBoardCandidate.upsert({
            where: {
              planBoardSlotId_vendorId: {
                planBoardSlotId: venueSlot.id,
                vendorId,
              },
            },
            create: {
              planBoardSlotId: venueSlot.id,
              vendorId,
            },
            update: {},
          })
        }
        continue
      }

      // その他のカテゴリ
      if (shouldSkip) {
        await prisma.planBoardSlot.upsert({
          where: {
            planBoardId_categoryId: {
              planBoardId: planBoard.id,
              categoryId: category.id,
            },
          },
          create: {
            planBoardId: planBoard.id,
            categoryId: category.id,
            state: 'skipped',
          },
          update: {
            state: 'skipped',
          },
        })
        continue
      }

      const allocation = planData.categoryAllocations.find(
        (a) => a.categoryId === category.id
      )
      const vendors = planData.categoryVendorCandidates[category.id] || []
      const selectedVendor = vendors[0]

      const slot = await prisma.planBoardSlot.upsert({
        where: {
          planBoardId_categoryId: {
            planBoardId: planBoard.id,
            categoryId: category.id,
          },
        },
        create: {
          planBoardId: planBoard.id,
          categoryId: category.id,
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
            selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
        },
        update: {
          state: selectedVendor ? 'candidate' : 'unselected',
          selectedVendorId: selectedVendor?.vendorId || null,
            selectedProfileId: selectedVendor?.profileId || null,
          estimatedCost: allocation?.allocatedMid || null,
        },
      })

      // 候補を追加
      for (const vendor of vendors.slice(0, 5)) {
        await prisma.planBoardCandidate.upsert({
          where: {
            planBoardSlotId_vendorId: {
              planBoardSlotId: slot.id,
              vendorId: vendor.vendorId,
            },
          },
          create: {
            planBoardSlotId: slot.id,
            vendorId: vendor.vendorId,
          },
          update: {},
        })
      }
    }

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
