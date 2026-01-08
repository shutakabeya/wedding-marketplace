import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.id },
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
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'ベンダーが見つかりません' },
        { status: 404 }
      )
    }

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    return NextResponse.json({
      vendor: {
        ...vendor,
        profile: vendor.profiles[0] || null,
      },
    })
  } catch (error) {
    console.error('Vendor profile GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  areas: z.array(z.string()).optional(),
  // 料金はプランから自動算出するが、後方互換性のため残す
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(), // 後方互換性のため残す（サムネイル用）
  profileImages: z.array(z.string()).optional(), // プロフィール画像（最大3枚）
  categoryType: z
    .enum(['venue', 'photographer', 'dress', 'planner', 'other'])
    .optional(),
  maxGuests: z.number().optional().nullable(),
  serviceTags: z.array(z.string()).optional(),
  plans: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(), // 円
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // 料金プランから最安値を算出（存在する場合）
    const computedPriceMin =
      data.plans && data.plans.length > 0
        ? Math.min(...data.plans.map((p) => p.price))
        : undefined

    // ベンダー基本情報更新
    if (data.name || data.bio !== undefined || data.logoUrl !== undefined) {
      await prisma.vendor.update({
        where: { id: session.id },
        data: {
          name: data.name,
          bio: data.bio,
          logoUrl: data.logoUrl,
        },
      })
    }

    // カテゴリ更新
    if (data.categoryIds) {
      await prisma.vendorCategory.deleteMany({
        where: { vendorId: session.id },
      })
      if (data.categoryIds.length > 0) {
        await prisma.vendorCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            vendorId: session.id,
            categoryId,
          })),
        })
      }
    }

    // デフォルトプロフィールを取得または作成
    let defaultProfile = await prisma.vendorProfile.findFirst({
      where: {
        vendorId: session.id,
        isDefault: true,
      },
    })

    if (!defaultProfile) {
      // デフォルトプロフィールが存在しない場合は作成
      defaultProfile = await prisma.vendorProfile.create({
        data: {
          vendorId: session.id,
          isDefault: true,
          name: 'デフォルトプロフィール',
          categoryType: data.categoryType || 'venue',
          imageUrl: data.imageUrl,
          profileImages: data.profileImages || [],
          areas: data.areas || [],
          maxGuests: data.maxGuests ?? null,
          serviceTags: data.serviceTags || [],
          plans: data.plans || [],
          priceMin: computedPriceMin ?? data.priceMin,
          priceMax: data.priceMax,
          styleTags: data.styleTags || [],
          services: data.services,
          constraints: data.constraints,
          // プロフィールのカテゴリを設定（ベンダーのカテゴリと同じ）
          categories: data.categoryIds && data.categoryIds.length > 0
            ? {
                create: data.categoryIds.map((categoryId) => ({
                  categoryId,
                })),
              }
            : undefined,
        },
      })
    } else {
      // 既存のデフォルトプロフィールを更新
      // プロフィールのカテゴリを更新（指定されている場合）
      if (data.categoryIds !== undefined) {
        // 既存のプロフィールカテゴリを削除
        await prisma.vendorProfileCategory.deleteMany({
          where: { profileId: defaultProfile!.id },
        })
        // 新しいプロフィールカテゴリを追加
        if (data.categoryIds.length > 0) {
          await prisma.vendorProfileCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              profileId: defaultProfile!.id,
              categoryId,
            })),
          })
        }
      }

      // undefinedの値を除外して、実際に更新する値のみを送信
      const updateData: any = {}
      if (data.categoryType !== undefined) updateData.categoryType = data.categoryType
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.profileImages !== undefined) updateData.profileImages = data.profileImages
      if (data.areas !== undefined) updateData.areas = data.areas
      if (data.maxGuests !== undefined) updateData.maxGuests = data.maxGuests
      if (data.serviceTags !== undefined) updateData.serviceTags = data.serviceTags
      if (data.plans !== undefined) updateData.plans = data.plans
      if (computedPriceMin !== undefined) updateData.priceMin = computedPriceMin
      else if (data.priceMin !== undefined) updateData.priceMin = data.priceMin
      if (data.priceMax !== undefined) updateData.priceMax = data.priceMax
      if (data.styleTags !== undefined) updateData.styleTags = data.styleTags
      if (data.services !== undefined) updateData.services = data.services
      if (data.constraints !== undefined) updateData.constraints = data.constraints

      await prisma.vendorProfile.update({
        where: { id: defaultProfile.id },
        data: updateData,
      })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.id },
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
        gallery: true,
      },
    })

    // 既存のAPIとの互換性のため、profileとしてデフォルトプロフィールを返す
    const vendorWithProfile = {
      ...vendor!,
      profile: vendor!.profiles[0] || null,
    }

    return NextResponse.json({ vendor: vendorWithProfile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Vendor profile PATCH error:', error)
    const errorMessage = error instanceof Error ? error.message : '更新に失敗しました'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
