import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

    // カテゴリフィルタ
    if (categoryName) {
      where.categories = {
        some: {
          category: {
            name: categoryName,
          },
        },
      }
    }

    // エリアフィルタ
    if (area) {
      where.profile = {
        areas: {
          has: area,
        },
      }
    }

    // 価格フィルタ
    if (priceMin || priceMax) {
      where.profile = {
        ...where.profile,
        OR: [
          { priceMin: { lte: priceMax ? parseInt(priceMax) : undefined } },
          { priceMax: { gte: priceMin ? parseInt(priceMin) : undefined } },
        ],
      }
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
        // まず、すべてのベンダーとプロフィールを取得（ページネーションは後で適用）
        [vendorsData, total] = await Promise.all([
          prisma.vendor.findMany({
            where,
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
              profiles: {
                // すべてのプロフィールを取得（デフォルト以外も含む）
                orderBy: [
                  { isDefault: 'desc' }, // デフォルトを優先
                  { createdAt: 'desc' }, // 作成日時順
                ],
              },
              gallery: {
                take: 1,
                orderBy: { displayOrder: 'asc' },
              },
            },
            orderBy,
            // ページネーションはプロフィール展開後に適用するため、ここでは取得しない
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
      if (vendor.profiles.length === 0) {
        // プロフィールがない場合は、ベンダー情報のみを返す（互換性のため）
        allVendors.push({
          ...vendor,
          profile: null,
        })
      } else {
        // 各プロフィールを個別の出品として追加
        for (const profile of vendor.profiles) {
          allVendors.push({
            ...vendor,
            profile: profile,
            // プロフィールIDを追加（必要に応じて）
            profileId: profile.id,
          })
        }
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
