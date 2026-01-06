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

    // 承認済みベンダーのみ表示
    const where: any = {
      status: 'approved',
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

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          profile: true,
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
    console.error('Vendors search error:', error)

    // DB につながっていない・起動していない場合は、エラーではなく空配列を返す
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P5010') {
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

    return NextResponse.json(
      { error: '検索に失敗しました' },
      { status: 500 }
    )
  }
}
