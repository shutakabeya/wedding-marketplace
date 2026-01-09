import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(), // プロフィール名（出品名）
  vendorName: z.string().optional(), // 屋号（vendors.nameを更新する場合）
  bio: z.string().optional().nullable(), // 自己紹介（vendors.bioを更新する場合）
  logoUrl: z.string().optional().nullable(), // ロゴ（vendors.logoUrlを更新する場合）
  imageUrl: z.string().optional().nullable(),
  profileImages: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  categoryType: z.enum(['venue', 'photographer', 'dress', 'planner', 'other']).optional(),
  categoryIds: z.array(z.string().uuid()).optional(), // カテゴリIDを追加
  maxGuests: z.number().optional().nullable(),
  serviceTags: z.array(z.string()).optional(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
  plans: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
  isDefault: z.boolean().optional(),
})

// プロフィール取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params

    const profile = await prisma.vendorProfile.findFirst({
      where: {
        id,
        vendorId: session.id,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            bio: true,
            logoUrl: true,
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      profile,
      vendor: profile.vendor, // ベンダー情報も返す
    })
  } catch (error) {
    console.error('Vendor profile GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

// プロフィール更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // プロフィールがベンダーのものか確認
    const existingProfile = await prisma.vendorProfile.findFirst({
      where: {
        id,
        vendorId: session.id,
      },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      )
    }

    // 料金プランから最安値を算出（存在する場合）
    const computedPriceMin =
      data.plans && data.plans.length > 0
        ? Math.min(...data.plans.map((p) => p.price))
        : undefined

    // ベンダー基本情報（vendorsテーブル）を更新（指定されている場合）
    if (data.vendorName || data.bio !== undefined || data.logoUrl !== undefined) {
      const vendorUpdateData: any = {}
      if (data.vendorName) vendorUpdateData.name = data.vendorName
      if (data.bio !== undefined) vendorUpdateData.bio = data.bio
      if (data.logoUrl !== undefined) vendorUpdateData.logoUrl = data.logoUrl
      
      await prisma.vendor.update({
        where: { id: session.id },
        data: vendorUpdateData,
      })
    }

    // デフォルトプロフィールを設定する場合、既存のデフォルトを解除
    if (data.isDefault === true) {
      await prisma.vendorProfile.updateMany({
        where: {
          vendorId: session.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    // プロフィールのカテゴリを更新（指定されている場合）
    if (data.categoryIds !== undefined) {
      // 既存のプロフィールカテゴリを削除
      await prisma.vendorProfileCategory.deleteMany({
        where: { profileId: id },
      })
      // 新しいプロフィールカテゴリを追加
      if (data.categoryIds.length > 0) {
        await prisma.vendorProfileCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            profileId: id,
            categoryId,
          })),
        })
      }
    }

    // undefinedの値を除外して、実際に更新する値のみを送信
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.profileImages !== undefined) updateData.profileImages = data.profileImages
    if (data.categoryType !== undefined) updateData.categoryType = data.categoryType
    if (data.maxGuests !== undefined) updateData.maxGuests = data.maxGuests
    if (data.serviceTags !== undefined) updateData.serviceTags = data.serviceTags
    if (data.areas !== undefined) updateData.areas = data.areas
    if (data.plans !== undefined) updateData.plans = data.plans
    if (computedPriceMin !== undefined) updateData.priceMin = computedPriceMin
    else if (data.priceMin !== undefined) updateData.priceMin = data.priceMin
    if (data.priceMax !== undefined) updateData.priceMax = data.priceMax
    if (data.styleTags !== undefined) updateData.styleTags = data.styleTags
    if (data.services !== undefined) updateData.services = data.services || null // nullを明示的に設定
    if (data.constraints !== undefined) updateData.constraints = data.constraints || null // nullを明示的に設定
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const profile = await prisma.vendorProfile.update({
      where: { id },
      data: updateData,
    })

    console.log(`Updated profile: id=${profile.id}, name=${profile.name}, services=${profile.services ? 'exists' : 'null'}, vendorId=${profile.vendorId}`)

    return NextResponse.json({ profile })
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

// プロフィール削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params

    // プロフィールがベンダーのものか確認
    const profile = await prisma.vendorProfile.findFirst({
      where: {
        id,
        vendorId: session.id,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      )
    }

    // デフォルトプロフィールを削除する場合、他のプロフィールがあれば最初のものをデフォルトに設定
    if (profile.isDefault) {
      const otherProfiles = await prisma.vendorProfile.findMany({
        where: {
          vendorId: session.id,
          id: { not: id },
        },
        take: 1,
      })
      if (otherProfiles.length > 0) {
        await prisma.vendorProfile.update({
          where: { id: otherProfiles[0].id },
          data: { isDefault: true },
        })
      }
    }

    await prisma.vendorProfile.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vendor profile DELETE error:', error)
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    )
  }
}
