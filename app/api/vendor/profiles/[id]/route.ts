import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().optional().nullable(),
  profileImages: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  categoryType: z.enum(['venue', 'photographer', 'dress', 'planner', 'other']).optional(),
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
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
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
    if (data.services !== undefined) updateData.services = data.services
    if (data.constraints !== undefined) updateData.constraints = data.constraints
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const profile = await prisma.vendorProfile.update({
      where: { id },
      data: updateData,
    })

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
