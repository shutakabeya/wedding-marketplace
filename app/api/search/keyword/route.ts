import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIdFromDisplayName, expandAreaIds, getMatchingAreaIds } from '@/lib/areas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json({ vendors: [], total: 0, page, limit })
    }

    // キーワードを分割して検索
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 0)

    // プロフィール、ベンダー名、bio、サービス内容、スタイルタグなどで検索
    const profileWhere: any = {
      vendor: {
        status: {
          in: ['approved', 'pending'],
        },
      },
    }

    // キーワード検索条件
    const keywordConditions: any[] = []

    for (const keyword of keywords) {
      const keywordConditionsForThisKeyword: any[] = []

      // ベンダー名で検索
      keywordConditionsForThisKeyword.push({
        vendor: {
          name: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
      })

      // プロフィール名で検索
      keywordConditionsForThisKeyword.push({
        name: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      })

      // サービスの説明で検索
      keywordConditionsForThisKeyword.push({
        services: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      })

      // スタイルタグで検索
      keywordConditionsForThisKeyword.push({
        styleTags: {
          has: keyword,
        },
      })

      // エリアで検索（地域グループにも対応）
      // キーワードが地域名（日本語）の場合は、IDに変換して検索
      const areaId = getIdFromDisplayName(keyword)
      if (areaId) {
        // 地域グループまたは個別エリアのIDが取得できた場合
        const matchingAreaIds = getMatchingAreaIds(areaId)
        keywordConditionsForThisKeyword.push({
          areas: {
            hasSome: matchingAreaIds,
          },
        })
      } else {
        // キーワードがID形式の可能性がある場合
        keywordConditionsForThisKeyword.push({
          areas: {
            has: keyword,
          },
        })
      }

      // ベンダーのbioで検索
      keywordConditionsForThisKeyword.push({
        vendor: {
          bio: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
      })

      // カテゴリ名で検索
      keywordConditionsForThisKeyword.push({
        categories: {
          some: {
            category: {
              name: {
                contains: keyword,
                mode: 'insensitive' as const,
              },
            },
          },
        },
      })

      keywordConditions.push({
        OR: keywordConditionsForThisKeyword,
      })
    }

    if (keywordConditions.length > 0) {
      profileWhere.AND = keywordConditions
    }

    // プロフィールを取得
    const [profiles, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where: profileWhere,
        include: {
          vendor: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorProfile.count({
        where: profileWhere,
      }),
    ])

    // 既存のAPIとの互換性を保つ形式に変換
    const vendors = profiles.map((profile) => {
      // デフォルトプロフィールを優先
      const isDefault = profile.isDefault
      const vendorCategories = profile.vendor.categories.map((vc) => vc.category)

      return {
        id: profile.vendorId,
        name: profile.vendor.name,
        bio: profile.vendor.bio,
        logoUrl: profile.vendor.logoUrl,
        categories: vendorCategories.map((cat) => ({ category: { name: cat.name } })),
        profile: {
          id: profile.id,
          name: profile.name,
          imageUrl: profile.imageUrl,
          profileImages: profile.profileImages || [],
          priceMin: profile.priceMin,
          priceMax: profile.priceMax,
          areas: profile.areas,
          styleTags: profile.styleTags,
          services: profile.services,
          constraints: profile.constraints,
        },
        profileId: profile.id,
        gallery: [], // ギャラリーは別途取得が必要
      }
    })

    return NextResponse.json({
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Keyword search error:', error)
    return NextResponse.json(
      { error: '検索に失敗しました', vendors: [], total: 0 },
      { status: 500 }
    )
  }
}
