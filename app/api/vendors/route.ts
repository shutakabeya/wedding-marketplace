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
    let vendorsData, total
    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
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
                where: { isDefault: true },
                take: 1,
              },
              gallery: {
                take: 1,
                orderBy: { displayOrder: 'asc' },
              },
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
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

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const vendors = vendorsData.map((vendor) => ({
      ...vendor,
      profile: vendor.profiles[0] || null,
    }))

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
