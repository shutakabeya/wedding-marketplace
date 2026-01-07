import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().optional().nullable(),
  areas: z.array(z.string()).optional(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
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

    const profile = await prisma.vendorProfile.update({
      where: { id },
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        areas: data.areas,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        styleTags: data.styleTags,
        services: data.services,
        constraints: data.constraints,
        isDefault: data.isDefault,
      },
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

    // デフォルトプロフィールは削除できない
    if (profile.isDefault) {
      return NextResponse.json(
        { error: 'デフォルトプロフィールは削除できません' },
        { status: 400 }
      )
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
