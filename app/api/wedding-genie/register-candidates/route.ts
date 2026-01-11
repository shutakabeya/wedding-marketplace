import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SelectedCandidate {
  categoryId: string
  vendorId: string
  profileId: string
  estimatedCost: number | null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      selectedCandidates,
      inputSnapshot,
      venueData,
    }: {
      selectedCandidates: SelectedCandidate[]
      inputSnapshot: any
      venueData: {
        selectedVenueId: string
        selectedProfileId: string
        estimatedPrice: number
      }
    } = body

    console.log('Register candidates request:', {
      selectedCandidatesCount: selectedCandidates.length,
      selectedCandidates: selectedCandidates,
      venueData,
    })

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
      planBoard = await prisma.planBoard.update({
        where: { id: planBoard.id },
        data: {
          venueArea: inputSnapshot.area,
          guestCount: inputSnapshot.guestCount,
        },
      })
    }

    // 会場カテゴリを取得
    const venueCategory = await prisma.category.findFirst({
      where: { name: '会場' },
    })

    if (!venueCategory) {
      return NextResponse.json(
        { error: '会場カテゴリが見つかりません' },
        { status: 500 }
      )
    }

    // 既存のスロットを取得
    const existingSlots = await prisma.planBoardSlot.findMany({
      where: { planBoardId: planBoard.id },
    })
    const existingSlotsMap = new Map(
      existingSlots.map((slot) => [slot.categoryId, slot])
    )

    // カテゴリごとに候補をグループ化
    const candidatesByCategory = new Map<string, SelectedCandidate[]>()
    for (const candidate of selectedCandidates) {
      if (!candidatesByCategory.has(candidate.categoryId)) {
        candidatesByCategory.set(candidate.categoryId, [])
      }
      candidatesByCategory.get(candidate.categoryId)!.push(candidate)
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
      profileId: string | null
      source: string
    }> = []

    // 会場を登録（selectedCandidatesに含まれていない場合のみ追加）
    const isVenueInSelectedCandidates = selectedCandidates.some((c) => c.categoryId === venueCategory.id)
    console.log('Is venue in selectedCandidates:', isVenueInSelectedCandidates)
    
    // 会場がselectedCandidatesに含まれていない場合、venueDataを使用して登録
    if (!isVenueInSelectedCandidates) {
      const venueSlot = existingSlotsMap.get(venueCategory.id)
      if (venueSlot) {
        slotsToUpdate.push({
          id: venueSlot.id,
          state: 'candidate', // 候補状態で登録
          selectedVendorId: venueData.selectedVenueId,
          selectedProfileId: venueData.selectedProfileId,
          estimatedCost: venueData.estimatedPrice,
        })
        console.log('Added venue to update list')
      } else {
        slotsToCreate.push({
          planBoardId: planBoard.id,
          categoryId: venueCategory.id,
          state: 'candidate', // 候補状態で登録
          selectedVendorId: venueData.selectedVenueId,
          selectedProfileId: venueData.selectedProfileId,
          estimatedCost: venueData.estimatedPrice,
        })
        console.log('Added venue to create list')
      }
    } else {
      console.log('Venue is already in selectedCandidates, skipping duplicate registration')
    }

    // 選択された候補を登録（カテゴリごとに処理）
    console.log('Processing selectedCandidates:', selectedCandidates.length, 'items')
    for (const [categoryId, candidates] of candidatesByCategory.entries()) {
      console.log(`Processing category ${categoryId} with ${candidates.length} candidates`)
      
      // 最初の候補をスロットのselectedVendorId/selectedProfileIdに設定
      const firstCandidate = candidates[0]
      const existingSlot = existingSlotsMap.get(categoryId)
      
      if (existingSlot) {
        console.log('Updating existing slot:', existingSlot.id)
        slotsToUpdate.push({
          id: existingSlot.id,
          state: 'candidate', // 候補状態で登録
          selectedVendorId: firstCandidate.vendorId,
          selectedProfileId: firstCandidate.profileId,
          estimatedCost: firstCandidate.estimatedCost,
        })
        
        // 2つ目以降の候補をPlanBoardCandidateに登録
        for (let i = 1; i < candidates.length; i++) {
          const candidate = candidates[i]
          candidatesToCreate.push({
            planBoardSlotId: existingSlot.id,
            vendorId: candidate.vendorId,
            profileId: candidate.profileId,
            source: 'genie',
          })
          console.log(`Added candidate ${i + 1} to PlanBoardCandidate list for slot ${existingSlot.id}`)
        }
      } else {
        console.log('Creating new slot for category:', categoryId)
        // スロットIDは作成後に取得する必要があるため、一時的なIDを使用
        // 実際の作成時には、作成されたスロットIDを使用する
        slotsToCreate.push({
          planBoardId: planBoard.id,
          categoryId: categoryId,
          state: 'candidate', // 候補状態で登録
          selectedVendorId: firstCandidate.vendorId,
          selectedProfileId: firstCandidate.profileId,
          estimatedCost: firstCandidate.estimatedCost,
        })
        
        // 2つ目以降の候補は、スロット作成後にPlanBoardCandidateに登録する必要がある
        // これらは後で処理する
      }
    }
    
    console.log('Slots to create:', slotsToCreate.length)
    console.log('Slots to update:', slotsToUpdate.length)
    console.log('Candidates to create:', candidatesToCreate.length)

    // トランザクション前に既存のPlanBoardCandidateをバッチ取得して重複を事前排除
    // これにより、トランザクション内でエラーが発生することを防ぐ
    // ユニーク制約: (planBoardSlotId, vendorId, profileId)
    const existingCandidateKeys = new Set<string>()
    if (candidatesToCreate.length > 0) {
      const slotIds = Array.from(new Set(candidatesToCreate.map((c) => c.planBoardSlotId)))
      const existingCandidates = await prisma.planBoardCandidate.findMany({
        where: {
          planBoardSlotId: { in: slotIds },
        },
        select: {
          planBoardSlotId: true,
          vendorId: true,
          profileId: true,
        },
      })
      
      // 既存レコードのキーを作成（ユニーク制約に基づく: slotId-vendorId-profileId）
      for (const candidate of existingCandidates) {
        const key = `${candidate.planBoardSlotId}-${candidate.vendorId}-${candidate.profileId || 'null'}`
        existingCandidateKeys.add(key)
      }
      
      console.log(`Found ${existingCandidateKeys.size} existing candidates out of ${candidatesToCreate.length} candidates to create`)
      if (existingCandidateKeys.size > 0) {
        console.log('Existing candidate keys:', Array.from(existingCandidateKeys).slice(0, 5), existingCandidateKeys.size > 5 ? '...' : '')
      }
    }
    
    // 既存レコードを除外（ユニーク制約に基づく重複チェック）
    // 同じvendorIdでも異なるprofileIdは別の候補として扱える
    const filteredCandidatesToCreate = candidatesToCreate.filter((candidate) => {
      const key = `${candidate.planBoardSlotId}-${candidate.vendorId}-${candidate.profileId || 'null'}`
      if (existingCandidateKeys.has(key)) {
        console.log(`Skipping duplicate candidate: slotId=${candidate.planBoardSlotId}, vendorId=${candidate.vendorId}, profileId=${candidate.profileId}`)
        return false
      }
      return true
    })
    
    console.log(`Filtered candidates to create: ${filteredCandidatesToCreate.length} (removed ${candidatesToCreate.length - filteredCandidatesToCreate.length} duplicates)`)

    // 除外カテゴリを skipped 状態で登録（既存のselectedを上書きしない）
    const excludedCategoryNames = inputSnapshot.excludedCategories || []
    const allCategories = await prisma.category.findMany()
    
    for (const category of allCategories) {
      if (
        category.name === '会場' ||
        excludedCategoryNames.includes(category.name) ||
        selectedCandidates.some((c) => c.categoryId === category.id)
      ) {
        continue // 既に処理済み
      }

      // プランナーカテゴリのスキップ処理
      const isPlannerCategory = ['プランナー', 'デイオブプランナー'].includes(category.name)
      const shouldSkip =
        isPlannerCategory &&
        ((inputSnapshot.plannerType === 'planner' && category.name === 'デイオブプランナー') ||
          (inputSnapshot.plannerType === 'day_of' && category.name === 'プランナー') ||
          inputSnapshot.plannerType === 'self')

      if (shouldSkip) {
        const existingSlot = existingSlotsMap.get(category.id)
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
      }
    }

    // トランザクションで一括処理
    // タイムアウトを15秒に設定（デフォルトは5秒、大量のデータを処理する場合に必要）
    let actualNewSlotCandidatesCount = 0 // 実際に作成された新規スロット用候補の数
    try {
      await prisma.$transaction(
        async (tx) => {
        // スロットを作成
        const createdSlots: Array<{ id: string; categoryId: string }> = []
        if (slotsToCreate.length > 0) {
          console.log('Creating slots:', slotsToCreate.length)
          for (const slotData of slotsToCreate) {
            const created = await tx.planBoardSlot.create({
              data: slotData,
            })
            createdSlots.push({ id: created.id, categoryId: created.categoryId })
            console.log(`Created slot ${created.id} for category ${created.categoryId}`)
          }
          console.log('Slots created successfully')
          
          // 作成されたスロットに対して、2つ目以降の候補をPlanBoardCandidateに登録
          // 新規作成されたスロットなので既存レコードがないはずだが、念のためチェック
          if (createdSlots.length > 0) {
            const newSlotIds = createdSlots.map((s) => s.id)
            const newSlotExistingCandidates = await tx.planBoardCandidate.findMany({
              where: {
                planBoardSlotId: { in: newSlotIds },
              },
              select: {
                planBoardSlotId: true,
                vendorId: true,
                profileId: true,
              },
            })
            
            console.log(`Found ${newSlotExistingCandidates.length} existing candidates for new slots (should be 0)`)
            
            const newSlotExistingKeys = new Set(
              newSlotExistingCandidates.map(
                (c) => `${c.planBoardSlotId}-${c.vendorId}-${c.profileId || 'null'}`
              )
            )
            
            const newSlotCandidatesToCreate: Array<{
              planBoardSlotId: string
              vendorId: string
              profileId: string | null
              source: string
            }> = []
            
            for (const createdSlot of createdSlots) {
              const categoryCandidates = candidatesByCategory.get(createdSlot.categoryId) || []
              console.log(`Processing ${categoryCandidates.length} candidates for new slot ${createdSlot.id} (category ${createdSlot.categoryId})`)
              for (let i = 1; i < categoryCandidates.length; i++) {
                const candidate = categoryCandidates[i]
                const key = `${createdSlot.id}-${candidate.vendorId}-${candidate.profileId || 'null'}`
                if (!newSlotExistingKeys.has(key)) {
                  newSlotCandidatesToCreate.push({
                    planBoardSlotId: createdSlot.id,
                    vendorId: candidate.vendorId,
                    profileId: candidate.profileId,
                    source: 'genie',
                  })
                  console.log(`Added candidate ${i + 1}/${categoryCandidates.length} for new slot ${createdSlot.id}`)
                } else {
                  console.log(`Skipped duplicate candidate for new slot ${createdSlot.id}`)
                }
              }
            }
            
            console.log(`New slot candidates to create: ${newSlotCandidatesToCreate.length}`)
            
            if (newSlotCandidatesToCreate.length > 0) {
              await Promise.all(
                newSlotCandidatesToCreate.map((candidateData) =>
                  tx.planBoardCandidate.create({
                    data: candidateData,
                  })
                )
              )
              actualNewSlotCandidatesCount = newSlotCandidatesToCreate.length
              console.log(`Added ${actualNewSlotCandidatesCount} candidates to newly created slots`)
            }
          }
        }

        // スロットを更新
        if (slotsToUpdate.length > 0) {
          console.log('Updating slots:', slotsToUpdate.length)
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
          console.log('Slots updated successfully')
        }

        // PlanBoardCandidateを作成（既存スロット用）
        // 既にトランザクション前で重複を排除済みなので、エラーハンドリング不要
        if (filteredCandidatesToCreate.length > 0) {
          console.log('Creating PlanBoardCandidates:', filteredCandidatesToCreate.length)
          await Promise.all(
            filteredCandidatesToCreate.map((candidateData) =>
              tx.planBoardCandidate.create({
                data: candidateData,
              })
            )
          )
          console.log('PlanBoardCandidates created successfully')
        }
        },
        {
          timeout: 15000, // 15秒に設定（デフォルトは5秒）
        }
      )
      console.log('Transaction completed successfully')
    } catch (txError) {
      console.error('Transaction error:', txError)
      throw txError
    }

    // 登録された件数を計算
    // 各カテゴリの最初の候補はスロットに、残りはPlanBoardCandidateに登録される
    // 会場がselectedCandidatesに含まれていない場合は、会場も1件としてカウント
    const totalSlots = slotsToCreate.length + slotsToUpdate.length
    const totalCandidates = filteredCandidatesToCreate.length
    
    // 新規作成されたスロットに対して追加された候補もカウント
    // 実際にトランザクション内で作成された数を使用
    const additionalCandidatesFromNewSlots = actualNewSlotCandidatesCount
    
    const totalRegistered = totalSlots + totalCandidates + additionalCandidatesFromNewSlots
    
    console.log('Final counts:', {
      totalSlots,
      totalCandidates,
      additionalCandidatesFromNewSlots,
      totalRegistered,
      selectedCandidatesCount: selectedCandidates.length,
      isVenueInSelectedCandidates
    })
    
    return NextResponse.json({
      success: true,
      planBoardId: planBoard.id,
      message: `${totalRegistered}件のベンダーをPlanBoardに登録しました`,
      registeredCount: totalRegistered,
      details: {
        slotsCreated: slotsToCreate.length,
        slotsUpdated: slotsToUpdate.length,
        candidatesCreated: totalCandidates + additionalCandidatesFromNewSlots,
      }
    })
  } catch (error) {
    console.error('Register candidates error:', error)
    return NextResponse.json(
      { error: 'PlanBoard登録に失敗しました' },
      { status: 500 }
    )
  }
}