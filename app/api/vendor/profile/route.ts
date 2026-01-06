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
        profile: true,
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

    return NextResponse.json({ vendor })
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
  categoryIds: z.array(z.string().uuid()).optional(),
  areas: z.array(z.string()).optional(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
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
    if (data.name || data.bio !== undefined) {
      await prisma.vendor.update({
        where: { id: session.id },
        data: {
          name: data.name,
          bio: data.bio,
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

    // プロフィール更新
    await prisma.vendorProfile.upsert({
      where: { vendorId: session.id },
      update: {
        areas: data.areas,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        styleTags: data.styleTags,
        services: data.services,
        constraints: data.constraints,
      },
      create: {
        vendorId: session.id,
        areas: data.areas || [],
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        styleTags: data.styleTags || [],
        services: data.services,
        constraints: data.constraints,
      },
    })

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        profile: true,
        gallery: true,
      },
    })

    return NextResponse.json({ vendor })
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
