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
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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
          imageUrl: data.imageUrl,
          areas: data.areas || [],
          priceMin: data.priceMin,
          priceMax: data.priceMax,
          styleTags: data.styleTags || [],
          services: data.services,
          constraints: data.constraints,
        },
      })
    } else {
      // 既存のデフォルトプロフィールを更新
      await prisma.vendorProfile.update({
        where: { id: defaultProfile.id },
        data: {
          imageUrl: data.imageUrl,
          areas: data.areas,
          priceMin: data.priceMin,
          priceMax: data.priceMax,
          styleTags: data.styleTags,
          services: data.services,
          constraints: data.constraints,
        },
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
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Vendor profile PATCH error:', error)
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    )
  }
}
