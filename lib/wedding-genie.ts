// Wedding Genie 生成ロジック
import { prisma } from './prisma'
import { getMatchingAreaIds, getDisplayName, expandAreaIds } from './areas'
import {
  CATEGORY_BUDGET_RANGES,
  PLANNER_BUDGET_RANGES,
  VENUE_BUDGET_RATIO,
  VENUE_CANDIDATE_LIMIT,
  VENDOR_CANDIDATE_INTERNAL_COUNT,
  type CategoryBudgetRange,
} from './wedding-genie-config'

export interface GenieInput {
  area: string
  guestCount: number
  totalBudget: number
  excludedCategories?: string[]
  priorityCategories?: string[]
  plannerType: 'planner' | 'day_of' | 'self' | 'undecided'
}

export interface VenueCandidate {
  vendorId: string
  profileId: string
  name: string
  estimatedPrice: number
  ratio: number
  score: number
}

export interface CategoryAllocation {
  categoryId: string
  categoryName: string
  allocatedMin: number
  allocatedMid: number
  allocatedMax: number
}

export interface VendorCandidate {
  vendorId: string
  profileId: string
  name: string
  priceMin: number | null
  priceMax: number | null
  actualPrice: number | null // 実際の価格（プロフィールから取得）
  plans?: Array<{ name: string; price: number; description?: string }> // 料金プラン（複数ある場合）
  isFallback?: boolean // fallback検索（エリア条件を無視）で取得された候補かどうか
}

export interface PlanResult {
  planType: 'balanced' | 'priority' | 'budget'
  venue: {
    selectedVenueId: string
    selectedProfileId: string
    alternativeVenueIds: string[]
    estimatedPrice: {
      min: number
      mid: number
      max: number
    }
  }
  plannerType: string
  plannerCost: {
    min: number
    mid: number
    max: number
  }
  categoryAllocations: CategoryAllocation[]
  categoryVendorCandidates: Record<string, VendorCandidate[]>
  totals: {
    totalMin: number
    totalMid: number
    totalMax: number
  }
}

// 会場候補を抽出
export async function extractVenueCandidates(
  area: string,
  guestCount: number,
  totalBudget: number
): Promise<VenueCandidate[]> {
  // エリアマッチング（グループ展開）
  const matchingAreaIds = getMatchingAreaIds(area)

  // 会場カテゴリを取得
  const venueCategory = await prisma.category.findFirst({
    where: { name: '会場' },
  })

  if (!venueCategory) {
    return []
  }

  // 会場プロフィールを検索
  const profiles = await prisma.vendorProfile.findMany({
    where: {
      categoryType: 'venue',
      areas: {
        hasSome: matchingAreaIds,
      },
      maxGuests: {
        gte: guestCount,
      },
      vendor: {
        status: 'approved',
      },
      categories: {
        some: {
          categoryId: venueCategory.id,
        },
      },
    },
    include: {
      vendor: true,
      categories: {
        include: {
          category: true,
        },
      },
    },
  })

  // 会場価格を推定してスコアリング
  const candidates: VenueCandidate[] = []

  for (const profile of profiles) {
    // 価格推定
    let estimatedPrice = 0

    // plansから推定（会場の料金は既に総額なので人数で掛けない）
    if (profile.plans && Array.isArray(profile.plans)) {
      const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
      if (plans.length > 0) {
        // 最安値プランを使用（priceは総額）
        const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
        estimatedPrice = minPlan.price
      }
    }

    // plansがない場合、priceMin/priceMaxから推定（会場の料金は総額）
    if (estimatedPrice === 0) {
      if (profile.priceMin && profile.priceMax) {
        // 平均値を使用（総額として扱う）
        estimatedPrice = (profile.priceMin + profile.priceMax) / 2
      } else if (profile.priceMin) {
        estimatedPrice = profile.priceMin
      } else if (profile.priceMax) {
        estimatedPrice = profile.priceMax
      } else {
        // デフォルト: 人数 × 1万円（会場の目安）
        estimatedPrice = 10000 * guestCount
      }
    }

    // 予算比率を計算
    const ratio = estimatedPrice / totalBudget
    const score = Math.abs(ratio - VENUE_BUDGET_RATIO.idealCenter)

    candidates.push({
      vendorId: profile.vendorId,
      profileId: profile.id,
      name: profile.name || profile.vendor.name,
      estimatedPrice,
      ratio,
      score,
    })
  }

  // スコアでソート（小さいほど良い）
  candidates.sort((a, b) => a.score - b.score)

  // 上位を返す
  return candidates.slice(0, VENUE_CANDIDATE_LIMIT)
}

// プランナー費用を取得
export function getPlannerCost(plannerType: string): { min: number; mid: number; max: number } {
  const range = PLANNER_BUDGET_RANGES[plannerType] || PLANNER_BUDGET_RANGES.undecided
  return {
    min: range.min,
    mid: range.mid,
    max: range.max,
  }
}

// バッチでベンダー候補を取得（最適化版）
async function getVendorCandidatesBatch(
  categoryIds: string[],
  area: string,
  allocatedBudgets: Map<string, number>,
  guestCount: number,
  giftCategoryIds: Set<string>
): Promise<Record<string, VendorCandidate[]>> {
  const matchingAreaIds = getMatchingAreaIds(area)
  const areaDisplayName = getDisplayName(area)
  const result: Record<string, VendorCandidate[]> = {}

  // すべてのカテゴリのベンダー候補を一度に取得
  // まず厳密な条件で検索
  const allProfiles = await prisma.vendorProfile.findMany({
    where: {
      AND: [
        {
          OR: [
            { areas: { hasSome: matchingAreaIds } },
            // 「全国」を含むプロフィールはすべてのエリアにマッチ
            { areas: { has: 'zenkoku' } },
            { areas: { has: '全国' } },
            areaDisplayName ? { areas: { has: areaDisplayName } } : undefined,
            { areas: { has: area } },
          ].filter(Boolean) as any,
        },
        {
          vendor: {
            status: 'approved',
          },
        },
        {
          categories: {
            some: {
              categoryId: { in: categoryIds },
            },
          },
        },
      ],
    },
    include: {
      vendor: true,
      categories: {
        include: {
          category: true,
        },
      },
    },
    take: 1000, // 十分な数を取得
  })

  // カテゴリごとにグループ化
  const profilesByCategory = new Map<string, typeof allProfiles>()
  for (const profile of allProfiles) {
    for (const pc of profile.categories) {
      if (categoryIds.includes(pc.categoryId)) {
        if (!profilesByCategory.has(pc.categoryId)) {
          profilesByCategory.set(pc.categoryId, [])
        }
        profilesByCategory.get(pc.categoryId)!.push(profile)
      }
    }
  }

  // 各カテゴリごとに候補をフィルタリング・ソート
  for (const categoryId of categoryIds) {
    const allocatedBudget = allocatedBudgets.get(categoryId) || 0
    const isGift = giftCategoryIds.has(categoryId)
    let categoryProfiles = profilesByCategory.get(categoryId) || []

    // 予算条件でフィルタリング
    categoryProfiles = categoryProfiles.filter((profile) => {
      if (!profile.priceMin && !profile.priceMax) return true
      if (profile.priceMin && profile.priceMin <= allocatedBudget) return true
      if (profile.priceMax && profile.priceMax >= allocatedBudget) return true
      return false
    })

    // 見つからない場合、予算条件を緩和
    if (categoryProfiles.length === 0) {
      categoryProfiles = (profilesByCategory.get(categoryId) || []).filter((profile) => {
        if (!profile.priceMin && !profile.priceMax) return true
        if (profile.priceMin && profile.priceMin <= allocatedBudget * 1.5) return true
        if (profile.priceMax && profile.priceMax >= allocatedBudget * 0.5) return true
        return false
      })
    }

    // それでも見つからない場合、エリア条件を緩和（カテゴリのみで検索）
    // 注意: この処理は個別クエリになるため、パフォーマンスに影響する可能性がある
    // ただし、元の動作を維持するために必要
    if (categoryProfiles.length === 0) {
      const fallbackProfiles = await prisma.vendorProfile.findMany({
        where: {
          vendor: {
            status: 'approved',
          },
          categories: {
            some: {
              categoryId,
            },
          },
        },
        include: {
          vendor: true,
        },
        orderBy: [
          {
            priceMin: 'asc',
          },
        ],
        take: VENDOR_CANDIDATE_INTERNAL_COUNT,
      })
      
      // VendorCandidate形式に変換してから、allocatedBudgetに最も近い順にソート
      const isGift = giftCategoryIds.has(categoryId)
      const fallbackProfilesWithPrice = fallbackProfiles.map((profile) => {
        let actualPrice: number | null = null

        if (isGift) {
          if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
            const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
            const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
            actualPrice = minPlan.price * guestCount
          } else if (profile.priceMin && profile.priceMax) {
            actualPrice = ((profile.priceMin + profile.priceMax) / 2) * guestCount
          } else if (profile.priceMin) {
            actualPrice = profile.priceMin * guestCount
          } else if (profile.priceMax) {
            actualPrice = profile.priceMax * guestCount
          }
        } else {
          if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
            const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
            const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
            actualPrice = minPlan.price
          } else if (profile.priceMin && profile.priceMax) {
            actualPrice = (profile.priceMin + profile.priceMax) / 2
          } else if (profile.priceMin) {
            actualPrice = profile.priceMin
          } else if (profile.priceMax) {
            actualPrice = profile.priceMax
          }
        }

        return {
          profile,
          actualPrice,
        }
      })

      // allocatedBudgetに最も近い価格の順にソート（価格差の絶対値でソート）
      fallbackProfilesWithPrice.sort((a, b) => {
        const aPrice = a.actualPrice ?? Infinity
        const bPrice = b.actualPrice ?? Infinity
        const aDiff = Math.abs(aPrice - allocatedBudget)
        const bDiff = Math.abs(bPrice - allocatedBudget)
        return aDiff - bDiff
      })

      // 同じprofileIdの重複を除去
      const uniqueFallbackProfiles = new Map<string, typeof fallbackProfilesWithPrice[0]>()
      for (const item of fallbackProfilesWithPrice) {
        const profileId = item.profile.id
        if (!uniqueFallbackProfiles.has(profileId)) {
          uniqueFallbackProfiles.set(profileId, item)
        }
      }
      const selectedFallbackProfiles = Array.from(uniqueFallbackProfiles.values()).slice(0, VENDOR_CANDIDATE_INTERNAL_COUNT)

      // VendorCandidate形式に変換
      result[categoryId] = selectedFallbackProfiles.map(({ profile, actualPrice }) => ({
        vendorId: profile.vendorId,
        profileId: profile.id,
        name: profile.name || profile.vendor.name,
        priceMin: profile.priceMin,
        priceMax: profile.priceMax,
        actualPrice,
        plans: profile.plans && Array.isArray(profile.plans)
          ? (profile.plans as Array<{ name: string; price: number; description?: string }>)
          : undefined,
        isFallback: true, // fallback検索で取得された候補
      }))
    } else {
      // 実際の価格を計算してから、allocatedBudgetに最も近い順にソート
      const profilesWithPrice = categoryProfiles.map((profile) => {
        let actualPrice: number | null = null

        if (isGift) {
          if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
            const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
            const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
            actualPrice = minPlan.price * guestCount
          } else if (profile.priceMin && profile.priceMax) {
            actualPrice = ((profile.priceMin + profile.priceMax) / 2) * guestCount
          } else if (profile.priceMin) {
            actualPrice = profile.priceMin * guestCount
          } else if (profile.priceMax) {
            actualPrice = profile.priceMax * guestCount
          }
        } else {
          if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
            const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
            const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
            actualPrice = minPlan.price
          } else if (profile.priceMin && profile.priceMax) {
            actualPrice = (profile.priceMin + profile.priceMax) / 2
          } else if (profile.priceMin) {
            actualPrice = profile.priceMin
          } else if (profile.priceMax) {
            actualPrice = profile.priceMax
          }
        }

        return {
          profile,
          actualPrice,
        }
      })

      // allocatedBudgetに最も近い価格の順にソート（価格差の絶対値でソート）
      profilesWithPrice.sort((a, b) => {
        const aPrice = a.actualPrice ?? Infinity
        const bPrice = b.actualPrice ?? Infinity
        const aDiff = Math.abs(aPrice - allocatedBudget)
        const bDiff = Math.abs(bPrice - allocatedBudget)
        return aDiff - bDiff
      })

      // 上位を取得（allocatedBudgetに最も近い候補）
      // 同じprofileIdの重複を除去
      const uniqueProfiles = new Map<string, typeof selectedProfiles[0]>()
      for (const item of profilesWithPrice) {
        const profileId = item.profile.id
        if (!uniqueProfiles.has(profileId)) {
          uniqueProfiles.set(profileId, item)
        }
      }
      const selectedProfiles = Array.from(uniqueProfiles.values()).slice(0, VENDOR_CANDIDATE_INTERNAL_COUNT)

      // VendorCandidate形式に変換
      result[categoryId] = selectedProfiles.map(({ profile, actualPrice }) => ({
        vendorId: profile.vendorId,
        profileId: profile.id,
        name: profile.name || profile.vendor.name,
        priceMin: profile.priceMin,
        priceMax: profile.priceMax,
        actualPrice,
        plans: profile.plans && Array.isArray(profile.plans)
          ? (profile.plans as Array<{ name: string; price: number; description?: string }>)
          : undefined,
      }))
    }
  }

  return result
}

// カテゴリ配分を計算
export async function calculateCategoryAllocations(
  input: GenieInput,
  venueEstimatedPrice: number,
  plannerCost: { min: number; mid: number; max: number },
  planType: 'balanced' | 'priority' | 'budget',
  allCategories?: Array<{ id: string; name: string }>,
  vendorCandidatesBatch?: Record<string, VendorCandidate[]>
): Promise<{
  allocations: CategoryAllocation[]
  vendorCandidates: Record<string, VendorCandidate[]>
}> {
  // 会場は予算の35-50%を目安にするが、実際の価格を使用
  // プランナー費用は先に計算せず、他のカテゴリと同様に扱う
  const remainingBudget = input.totalBudget - venueEstimatedPrice

  // 全カテゴリを取得（会場のみ除外、プランナー系は除外しない）
  // キャッシュされていない場合のみ取得
  if (!allCategories) {
    allCategories = await prisma.category.findMany({
      where: {
        name: {
          not: '会場', // 会場は除外
        },
      },
    })
  }

  // 除外カテゴリ（プランナー系は除外しない）
  const excludedCategoryNames = [
    ...(input.excludedCategories || []),
  ]

  // 対象カテゴリをフィルタ
  const targetCategories = allCategories.filter(
    (cat) => !excludedCategoryNames.includes(cat.name)
  )

  // カテゴリ別配分を計算
  const allocations: CategoryAllocation[] = []
  const vendorCandidates: Record<string, VendorCandidate[]> = {}

  for (const category of targetCategories) {
    // プランナー系カテゴリはPLANNER_BUDGET_RANGESから取得
    let range: CategoryBudgetRange | undefined
    if (category.name === 'デイオブプランナー') {
      const plannerRange = PLANNER_BUDGET_RANGES.day_of
      range = {
        min: plannerRange.min,
        mid: plannerRange.mid,
        max: plannerRange.max,
      }
    } else if (category.name === 'プランナー') {
      const plannerRange = PLANNER_BUDGET_RANGES.planner
      range = {
        min: plannerRange.min,
        mid: plannerRange.mid,
        max: plannerRange.max,
      }
    } else {
      range = CATEGORY_BUDGET_RANGES[category.name]
    }
    
    if (!range) continue

    let allocatedMin = range.min
    let allocatedMid = range.mid
    let allocatedMax = range.max

    // 引き出物だけは人数で掛ける（単価なので）
    const isGift = category.name === '引き出物'
    if (isGift) {
      allocatedMin = range.min * input.guestCount
      allocatedMid = range.mid * input.guestCount
      allocatedMax = range.max * input.guestCount
    } else {
      // プランタイプに応じて調整
      if (planType === 'priority') {
        // 重視カテゴリはmax寄り
        if (input.priorityCategories?.includes(category.name)) {
          allocatedMin = range.max * 0.8
          allocatedMid = range.max * 0.9
          allocatedMax = range.max
        } else {
          // その他はmin〜mid
          allocatedMin = range.min
          allocatedMid = range.mid * 0.8
          allocatedMax = range.mid
        }
      } else if (planType === 'budget') {
        // 節約型: 全カテゴリmin、priorityはmid
        if (input.priorityCategories?.includes(category.name)) {
          allocatedMin = range.mid * 0.7
          allocatedMid = range.mid
          allocatedMax = range.mid * 1.2
        } else {
          allocatedMin = range.min
          allocatedMid = range.min
          allocatedMax = range.min * 1.2
        }
      }
      // balancedはそのまま
    }

    // ベンダー候補を取得（引き出物の場合は人数を考慮）
    const searchBudget = allocatedMid
    // バッチ取得された候補を使用、なければ個別取得（ただし、空のオブジェクトを渡された場合は候補を取得しない）
    let candidates: VendorCandidate[] = []
    if (vendorCandidatesBatch && Object.keys(vendorCandidatesBatch).length > 0 && vendorCandidatesBatch[category.id]) {
      candidates = vendorCandidatesBatch[category.id]
      vendorCandidates[category.id] = candidates
    } else if (!vendorCandidatesBatch || Object.keys(vendorCandidatesBatch).length > 0) {
      // バッチが提供されていない、または空でない場合は個別取得
      // ただし、空のオブジェクトが明示的に渡された場合は候補を取得しない（予算配分のみ計算）
      if (vendorCandidatesBatch !== undefined && Object.keys(vendorCandidatesBatch).length === 0) {
        // 空のバッチが明示的に渡された場合は候補を取得せず、空の配列を設定
        vendorCandidates[category.id] = []
      } else {
        candidates = await getVendorCandidates(category.id, input.area, searchBudget, input.guestCount, isGift)
        vendorCandidates[category.id] = candidates
      }
    }

    // ベンダー候補が見つかった場合、実際の価格で配分を更新
    if (candidates.length > 0 && candidates[0].actualPrice !== null) {
      const actualPrice = candidates[0].actualPrice
      // 実際の価格を基準にレンジを設定
      allocatedMin = actualPrice * 0.9
      allocatedMid = actualPrice
      allocatedMax = actualPrice * 1.1
    }

    allocations.push({
      categoryId: category.id,
      categoryName: category.name,
      allocatedMin,
      allocatedMid,
      allocatedMax,
    })
  }

  // 予算オーバー時の調整
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedMid, 0)
  if (totalAllocated > remainingBudget) {
    // priority以外を順にminへ
    const nonPriorityAllocations = allocations.filter(
      (alloc) => !input.priorityCategories?.includes(alloc.categoryName)
    )

    for (const alloc of nonPriorityAllocations) {
      // プランナー系カテゴリはPLANNER_BUDGET_RANGESから取得
      let range: CategoryBudgetRange | undefined
      if (alloc.categoryName === 'デイオブプランナー') {
        const plannerRange = PLANNER_BUDGET_RANGES.day_of
        range = {
          min: plannerRange.min,
          mid: plannerRange.mid,
          max: plannerRange.max,
        }
      } else if (alloc.categoryName === 'プランナー') {
        const plannerRange = PLANNER_BUDGET_RANGES.planner
        range = {
          min: plannerRange.min,
          mid: plannerRange.mid,
          max: plannerRange.max,
        }
      } else {
        range = CATEGORY_BUDGET_RANGES[alloc.categoryName]
      }
      
      if (!range) continue

      // 引き出物の場合は人数で掛ける
      const isGift = alloc.categoryName === '引き出物'
      if (isGift) {
        alloc.allocatedMin = range.min * input.guestCount
        alloc.allocatedMid = range.min * input.guestCount
        alloc.allocatedMax = range.min * 1.2 * input.guestCount
      } else {
        alloc.allocatedMin = range.min
        alloc.allocatedMid = range.min
        alloc.allocatedMax = range.min * 1.2
      }

      // 再計算
      const newTotal = allocations.reduce((sum, a) => sum + a.allocatedMid, 0)
      if (newTotal <= remainingBudget) break
    }
  }

  return { allocations, vendorCandidates }
}

// ベンダー候補を取得
async function getVendorCandidates(
  categoryId: string,
  area: string,
  allocatedBudget: number,
  guestCount: number = 1,
  isGift: boolean = false
): Promise<VendorCandidate[]> {
  const matchingAreaIds = getMatchingAreaIds(area)
  const areaDisplayName = getDisplayName(area)

  // まず厳密な条件で検索（予算内）
  let profiles = await prisma.vendorProfile.findMany({
    where: {
      AND: [
        // エリア条件：新旧両方のデータ形式に対応
        {
          OR: [
            // 新フォーマット（エリアID/グループID）
            {
              areas: {
                hasSome: matchingAreaIds,
              },
            },
            // 「全国」を含むプロフィールはすべてのエリアにマッチ
            {
              areas: {
                has: 'zenkoku',
              },
            },
            {
              areas: {
                has: '全国',
              },
            },
            // 旧フォーマット（日本語の都道府県名）
            areaDisplayName
              ? {
                  areas: {
                    has: areaDisplayName,
                  },
                }
              : undefined,
            // 念のため、areaそのものも見る
            {
              areas: {
                has: area,
              },
            },
          ].filter(Boolean) as any,
        },
        {
          vendor: {
            status: 'approved',
          },
        },
        {
          // プロフィールに紐づくカテゴリでフィルタ（検索APIと同じ考え方）
          categories: {
            some: {
              categoryId,
            },
          },
        },
        {
          // 価格レンジ：割り当て予算から大きく外れていないものを優先
          OR: [
            {
              priceMin: {
                lte: allocatedBudget,
              },
            },
            {
              priceMax: {
                gte: allocatedBudget,
              },
            },
            // 価格未設定のプロフィールも候補に含める
            {
              AND: [{ priceMin: null }, { priceMax: null }],
            },
          ],
        },
      ],
    },
    include: {
      vendor: true,
    },
    take: VENDOR_CANDIDATE_INTERNAL_COUNT,
  })

  // 見つからない場合、予算条件を緩和（1.5倍まで許容）
  if (profiles.length === 0) {
    profiles = await prisma.vendorProfile.findMany({
      where: {
        AND: [
          {
            OR: [
              { areas: { hasSome: matchingAreaIds } },
              // 「全国」を含むプロフィールはすべてのエリアにマッチ
              { areas: { has: 'zenkoku' } },
              { areas: { has: '全国' } },
              areaDisplayName ? { areas: { has: areaDisplayName } } : undefined,
              { areas: { has: area } },
            ].filter(Boolean) as any,
          },
          {
            vendor: {
              status: 'approved',
            },
          },
          {
            categories: {
              some: {
                categoryId,
              },
            },
          },
          {
            OR: [
              {
                priceMin: {
                  lte: allocatedBudget * 1.5,
                },
              },
              {
                priceMax: {
                  gte: allocatedBudget * 0.5,
                },
              },
              {
                AND: [{ priceMin: null }, { priceMax: null }],
              },
            ],
          },
        ],
      },
      include: {
        vendor: true,
      },
      orderBy: [
        {
          priceMin: 'asc',
        },
      ],
      take: VENDOR_CANDIDATE_INTERNAL_COUNT,
    })
  }

  // それでも見つからない場合、エリア条件も緩和（カテゴリのみ）
  // ただし、fallback検索で取得された候補は除外される（genieプラン登録時にフィルタされる）
  let isFallbackSearch = false
  if (profiles.length === 0) {
    isFallbackSearch = true
    profiles = await prisma.vendorProfile.findMany({
      where: {
        vendor: {
          status: 'approved',
        },
        categories: {
          some: {
            categoryId,
          },
        },
      },
      include: {
        vendor: true,
      },
      orderBy: [
        {
          priceMin: 'asc',
        },
      ],
      take: VENDOR_CANDIDATE_INTERNAL_COUNT,
    })
  }

  // 実際の価格を計算
  const profilesWithPrice = profiles.map((profile) => {
    let actualPrice: number | null = null
    
    // 引き出物の場合は人数で掛ける必要がある
    if (isGift) {
      // plansから最適なプランを選ぶ
      if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
        const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
        // 最安値プランを使用（単価として扱う）
        const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
        actualPrice = minPlan.price * guestCount
      } else if (profile.priceMin && profile.priceMax) {
        // 平均値 × 人数
        actualPrice = ((profile.priceMin + profile.priceMax) / 2) * guestCount
      } else if (profile.priceMin) {
        actualPrice = profile.priceMin * guestCount
      } else if (profile.priceMax) {
        actualPrice = profile.priceMax * guestCount
      }
    } else {
      // 引き出物以外は総額として扱う
      if (profile.plans && Array.isArray(profile.plans) && profile.plans.length > 0) {
        const plans = profile.plans as Array<{ name: string; price: number; description?: string }>
        // 最安値プランを使用（総額）
        const minPlan = plans.reduce((min, plan) => (plan.price < min.price ? plan : min))
        actualPrice = minPlan.price
      } else if (profile.priceMin && profile.priceMax) {
        // 平均値
        actualPrice = (profile.priceMin + profile.priceMax) / 2
      } else if (profile.priceMin) {
        actualPrice = profile.priceMin
      } else if (profile.priceMax) {
        actualPrice = profile.priceMax
      }
    }

    return {
      profile,
      actualPrice,
    }
  })

  // allocatedBudgetに最も近い価格の順にソート（価格差の絶対値でソート）
  profilesWithPrice.sort((a, b) => {
    const aPrice = a.actualPrice ?? Infinity
    const bPrice = b.actualPrice ?? Infinity
    const aDiff = Math.abs(aPrice - allocatedBudget)
    const bDiff = Math.abs(bPrice - allocatedBudget)
    return aDiff - bDiff
  })

  // 同じprofileIdの重複を除去
  const uniqueProfilesWithPrice = new Map<string, typeof profilesWithPrice[0]>()
  for (const item of profilesWithPrice) {
    const profileId = item.profile.id
    if (!uniqueProfilesWithPrice.has(profileId)) {
      uniqueProfilesWithPrice.set(profileId, item)
    }
  }
  const selectedProfilesWithPrice = Array.from(uniqueProfilesWithPrice.values()).slice(0, VENDOR_CANDIDATE_INTERNAL_COUNT)

  // VendorCandidate形式に変換
  return selectedProfilesWithPrice.map(({ profile, actualPrice }) => ({
    vendorId: profile.vendorId,
    profileId: profile.id,
    name: profile.name || profile.vendor.name,
    priceMin: profile.priceMin,
    priceMax: profile.priceMax,
    actualPrice,
    plans: profile.plans && Array.isArray(profile.plans) 
      ? (profile.plans as Array<{ name: string; price: number; description?: string }>)
      : undefined,
    isFallback: isFallbackSearch, // fallback検索で取得された候補かどうか
  }))
}

// プランを生成
export async function generatePlans(input: GenieInput): Promise<PlanResult[]> {
  // 会場候補を抽出
  const venueCandidates = await extractVenueCandidates(
    input.area,
    input.guestCount,
    input.totalBudget
  )

  if (venueCandidates.length === 0) {
    throw new Error(
      `該当する会場が見つかりませんでした。エリア: ${input.area}, 人数: ${input.guestCount}人。条件を変更してお試しください。`
    )
  }

  // メイン会場と代替会場を選択
  const mainVenue = venueCandidates[0]
  const alternativeVenues = venueCandidates.slice(1, 3).map((v) => v.vendorId)

  const venueEstimatedPrice = mainVenue.estimatedPrice

  // 全カテゴリを一度だけ取得（キャッシュ）
  const allCategories = await prisma.category.findMany({
    where: {
      name: {
        not: '会場',
      },
    },
  })

  // 除外カテゴリをフィルタ
  const excludedCategoryNames = [
    ...(input.excludedCategories || []),
  ]
  const targetCategories = allCategories.filter(
    (cat) => !excludedCategoryNames.includes(cat.name)
  )

  // まず予算配分を計算（候補は取得せず、予算配分のみ）
  const dummyPlannerCost = { min: 0, mid: 0, max: 0 }
  const { allocations: balancedAllocations } = await calculateCategoryAllocations(
    input,
    venueEstimatedPrice,
    dummyPlannerCost,
    'balanced',
    allCategories,
    {} // 空のバッチを渡すことで、候補は取得せず予算配分のみ計算
  )

  // 計算された予算配分からallocatedBudgetsを作成（ユーザー要望に合わせた比率）
  const allocatedBudgets = new Map<string, number>()
  const giftCategoryIds = new Set<string>()
  
  for (const alloc of balancedAllocations) {
    // allocatedMidをそのまま使用（ユーザー要望に合わせた比率で計算済み）
    allocatedBudgets.set(alloc.categoryId, alloc.allocatedMid)
    
    // 引き出物カテゴリのIDを記録
    const category = allCategories.find(c => c.id === alloc.categoryId)
    if (category && category.name === '引き出物') {
      giftCategoryIds.add(alloc.categoryId)
    }
  }

  // 計算された予算配分に基づいてバッチでベンダー候補を取得
  const vendorCandidatesBatch = await getVendorCandidatesBatch(
    balancedAllocations.map(alloc => alloc.categoryId),
    input.area,
    allocatedBudgets,
    input.guestCount,
    giftCategoryIds
  )

  // バッチ取得した候補を使用して最終的な配分と候補を取得
  const { allocations, vendorCandidates: categoryVendors } =
    await calculateCategoryAllocations(
      input,
      venueEstimatedPrice,
      dummyPlannerCost,
      'balanced', // balancedプランのみ生成
      allCategories,
      vendorCandidatesBatch // バッチ取得した候補を使用
    )

  // プランナー費用を取得（表示用のみ）
  const plannerCost = getPlannerCost(input.plannerType)

  // 合計を計算（プランナー費用は他のカテゴリと同様にallocationsに含まれている）
  const totalMin =
    venueEstimatedPrice * 0.9 +
    allocations.reduce((sum, alloc) => sum + alloc.allocatedMin, 0)
  const totalMid =
    venueEstimatedPrice + allocations.reduce((sum, alloc) => sum + alloc.allocatedMid, 0)
  const totalMax =
    venueEstimatedPrice * 1.1 +
    allocations.reduce((sum, alloc) => sum + alloc.allocatedMax, 0)

  // 各カテゴリの候補を3つまでに制限（UIで比較表示するため）
  const limitedCategoryVendors: Record<string, VendorCandidate[]> = {}
  for (const [categoryId, candidates] of Object.entries(categoryVendors)) {
    limitedCategoryVendors[categoryId] = candidates.slice(0, 3)
  }

  // 会場候補をVendorCandidate形式に変換して追加（最大3つ）
  const venueCategory = await prisma.category.findFirst({
    where: { name: '会場' },
  })
  if (venueCategory) {
    const venueCandidatesAsVendor: VendorCandidate[] = venueCandidates.slice(0, 3).map((vc) => ({
      vendorId: vc.vendorId,
      profileId: vc.profileId,
      name: vc.name,
      priceMin: vc.estimatedPrice * 0.9,
      priceMax: vc.estimatedPrice * 1.1,
      actualPrice: vc.estimatedPrice,
      isFallback: false,
    }))
    limitedCategoryVendors[venueCategory.id] = venueCandidatesAsVendor
  }

  const planResult: PlanResult = {
    planType: 'balanced',
    venue: {
      selectedVenueId: mainVenue.vendorId,
      selectedProfileId: mainVenue.profileId,
      alternativeVenueIds: alternativeVenues,
      estimatedPrice: {
        min: venueEstimatedPrice * 0.9,
        mid: venueEstimatedPrice,
        max: venueEstimatedPrice * 1.1,
      },
    },
    plannerType: input.plannerType,
    plannerCost,
    categoryAllocations: allocations,
    categoryVendorCandidates: limitedCategoryVendors,
    totals: {
      totalMin,
      totalMid,
      totalMax,
    },
  }

  // 後方互換性のため、配列として返す
  return [planResult]
}
