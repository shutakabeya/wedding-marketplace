import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getMatchingAreaIds, getDisplayName, expandAreaIds } from '@/lib/areas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryName = searchParams.get('category')
    const area = searchParams.get('area')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const sort = searchParams.get('sort') || 'recommended'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 承認済み・承認待ちのベンダーを表示（rejected、suspendedは除外）
    const where: any = {
      status: {
        in: ['approved', 'pending'],
      },
    }

    // カテゴリフィルタ（プロフィールのcategoriesでフィルタリング）
    const targetCategoryName = categoryName || null

    // プロフィールがあるベンダーのみを表示
    // エリアフィルタ、価格フィルタ、カテゴリフィルタもここで適用
    const profileFilter: any = {}
    
    // エリアフィルタ：エリアマスタベースの検索（既存データとの互換性を保つ）
    // 既存データは自由入力の文字列（例: "東京都"）、新規データはエリアID（例: "tokyo"）
    if (area) {
      // エリアマスタからマッチするエリアID/グループIDを取得
      // 例: 'chiba' を検索 → ['chiba', 'kanto', 'zenkoku'] を返す
      const matchingAreaIds = getMatchingAreaIds(area)
      
      // エリアマスタベースの検索（新規データ）と既存データ（自由入力）の両方に対応
      // エリアIDがマッチするか、または既存データの文字列がマッチするかをチェック
      // 「全国」（zenkoku）を含むプロフィールはすべてのエリア検索にマッチ
      profileFilter.OR = [
        // エリアマスタベースの検索（新規データ）
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
        // 既存データ（自由入力）との互換性：「全国」の日本語表記
        {
          areas: {
            has: '全国',
          },
        },
        // 既存データ（自由入力）との互換性：エリア名で検索
        {
          areas: {
            has: getDisplayName(area), // エリアIDからエリア名に変換して検索
          },
        },
        // エリアIDそのものでも検索（念のため）
        {
          areas: {
            has: area,
          },
        },
      ]
    }

    if (priceMin || priceMax) {
      const priceConditions: any[] = []
      if (priceMin) {
        priceConditions.push({
          priceMax: {
            gte: parseInt(priceMin),
          },
        })
      }
      if (priceMax) {
        priceConditions.push({
          priceMin: {
            lte: parseInt(priceMax),
          },
        })
      }
      if (priceConditions.length > 0) {
        profileFilter.OR = priceConditions
      }
    }

    // カテゴリフィルタをデータベースクエリレベルで適用（パフォーマンス向上）
    if (targetCategoryName) {
      profileFilter.categories = {
        some: {
          category: {
            name: targetCategoryName,
          },
        },
      }
    }

    // プロフィールが存在するベンダーのみを取得（すべてのフィルタを適用）
    where.profiles = {
      some: Object.keys(profileFilter).length > 0 ? profileFilter : {},
    }

    // ソート
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') {
      orderBy = { profile: { priceMin: 'asc' } }
    } else if (sort === 'price_desc') {
      orderBy = { profile: { priceMax: 'desc' } }
    } else if (sort === 'name') {
      orderBy = { name: 'asc' }
    }

    // 接続プールタイムアウトを防ぐため、リトライロジックを追加
    let vendorsData: any[] | undefined
    let total: number | undefined
    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        // フィルタ条件に一致するプロフィールを持つベンダーのみを取得
        // パフォーマンス向上のため、必要なフィールドのみを取得
        [vendorsData, total] = await Promise.all([
          prisma.vendor.findMany({
            where,
            select: {
              id: true,
              name: true,
              // bioは検索結果一覧では不要（詳細ページで取得）のため除外
              logoUrl: true,
              categories: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      displayOrder: true,
                    },
                  },
                },
              },
              profiles: {
                // フィルタ条件に一致するプロフィールのみを取得（パフォーマンス向上）
                where: Object.keys(profileFilter).length > 0 ? profileFilter : undefined,
                orderBy: [
                  { isDefault: 'desc' }, // デフォルトを優先
                  { createdAt: 'desc' }, // 作成日時順
                ],
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  profileImages: true,
                  priceMin: true,
                  priceMax: true,
                  areas: true,
                  styleTags: true,
                  services: true, // 検索結果一覧で使用されるため必要
                  // constraintsは検索結果一覧では不要（詳細ページで取得）のため除外
                  categoryType: true,
                  maxGuests: true,
                  serviceTags: true,
                  plans: true,
                  categories: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true,
                          displayOrder: true,
                        },
                      },
                    },
                  },
                },
              },
              gallery: {
                take: 1,
                orderBy: { displayOrder: 'asc' },
                select: {
                  id: true,
                  imageUrl: true,
                  caption: true,
                },
              },
            },
            orderBy,
            // プロフィール展開を考慮して、適切な件数制限を設定
            // 1ベンダーあたり平均1-3プロフィールを想定して、limitの10倍程度取得
            // ただし、最大200件まで（パフォーマンスとメモリ使用量のバランス）
            take: Math.min(limit * 10, 200),
          }),
          prisma.vendor.count({ where }),
        ])
        break // 成功したらループを抜ける
      } catch (error: any) {
        if (error?.code === 'P2024' && retries < maxRetries - 1) {
          // 接続プールタイムアウトの場合、少し待ってからリトライ
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
          continue
        }
        throw error // それ以外のエラーまたは最大リトライ回数に達した場合は再スロー
      }
    }

    // リトライが失敗した場合のフォールバック
    if (!vendorsData || total === undefined) {
      vendorsData = []
      total = 0
    }

    // 各プロフィールを個別の出品として展開
    const allVendors: any[] = []
    for (const vendor of vendorsData) {
      // プロフィールがないベンダーは表示しない
      if (vendor.profiles.length === 0) {
        continue
      }

      // 各プロフィールを個別の出品として追加
      // フィルタはすでにデータベースクエリレベルで適用されているため、
      // ここでの追加フィルタリングは不要（ただし、念のためエリアと価格の再チェックは残す）
      for (const profile of vendor.profiles) {
        // カテゴリフィルタはデータベースクエリで適用済みのため、ここでは不要
        
        // エリアフィルタが指定されている場合、念のため再チェック（クエリの条件と一致するはず）
        // エリアマスタベースの検索と既存データ（自由入力）の両方に対応
        // 「全国」を含むプロフィールはすべてのエリアにマッチ
        if (area) {
          // 「全国」を含む場合は常にマッチ
          if (profile.areas.includes('zenkoku') || profile.areas.includes('全国')) {
            // マッチするので処理続行
          } else {
            // 検索エリアのマッチングIDを取得（例: 'chiba' → ['chiba', 'kanto', 'zenkoku']）
            const matchingAreaIds = getMatchingAreaIds(area)
            const areaDisplayName = getDisplayName(area)
            
            // プロフィールのエリアを展開（グループIDを個別エリアIDに変換）
            const expandedProfileAreas = expandAreaIds(profile.areas)
            
            // エリアIDがマッチするか、または既存データの文字列がマッチするかをチェック
            const hasMatchingArea = 
              // プロフィールのエリア（元のID）が検索エリアのマッチングIDに含まれる
              profile.areas.some((profileAreaId: string) => 
                matchingAreaIds.includes(profileAreaId) ||
                profileAreaId === areaDisplayName ||
                profileAreaId === area
              ) ||
              // 展開されたプロフィールエリアの中に検索エリアが含まれる
              expandedProfileAreas.includes(area) ||
              expandedProfileAreas.some(epa => matchingAreaIds.includes(epa)) ||
              // 既存データ（日本語の都道府県名）との互換性
              profile.areas.includes(areaDisplayName)
            
            if (!hasMatchingArea) {
              continue
            }
          }
        }

        // 価格フィルタが指定されている場合、念のため再チェック（クエリの条件と一致するはず）
        if (priceMin || priceMax) {
          const profilePriceMin = profile.priceMin
          const profilePriceMax = profile.priceMax
          const minPrice = priceMin ? parseInt(priceMin) : undefined
          const maxPrice = priceMax ? parseInt(priceMax) : undefined

          // 価格範囲が一致しない場合はスキップ
          if (minPrice && profilePriceMax && profilePriceMax < minPrice) {
            continue
          }
          if (maxPrice && profilePriceMin && profilePriceMin > maxPrice) {
            continue
          }
        }

        // プロフィール情報を明示的に設定（必要なフィールドをすべて含める）
        allVendors.push({
          id: vendor.id,
          name: vendor.name,
          bio: null, // 検索結果一覧では不要（詳細ページで取得）
          logoUrl: vendor.logoUrl,
          categories: vendor.categories,
          gallery: vendor.gallery,
          profile: {
            id: profile.id,
            name: profile.name,
            imageUrl: profile.imageUrl,
            profileImages: profile.profileImages || [],
            priceMin: profile.priceMin,
            priceMax: profile.priceMax,
            areas: profile.areas || [],
            styleTags: profile.styleTags || [],
            services: profile.services,
            constraints: null, // 検索結果一覧では不要（詳細ページで取得）
            categoryType: profile.categoryType,
            maxGuests: profile.maxGuests,
            serviceTags: profile.serviceTags || [],
            plans: profile.plans,
          },
          profileId: profile.id, // プロフィールIDを明示的に追加
        })
      }
    }

    // プロフィール展開後にページネーションを適用
    const actualTotal = allVendors.length
    const vendors = allVendors.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / limit),
      },
    })
  } catch (error) {
    // 詳細なエラー情報をログに出力（デバッグ用）
    console.error('Vendors search error:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', error.meta)
      
      // P5010: データベース接続エラー
      // P2024: 接続プールタイムアウト
      if (error.code === 'P5010' || error.code === 'P2024') {
        console.warn(`Database connection error (${error.code}), returning empty results`)
        return NextResponse.json({
          vendors: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    return NextResponse.json(
      { 
        error: '検索に失敗しました',
        // 開発環境でのみエラー詳細を返す（本番環境ではセキュリティのため非表示）
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { details: error.message } : {})
      },
      { status: 500 }
    )
  }
}
