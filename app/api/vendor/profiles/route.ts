import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createProfileSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  areas: z.array(z.string()).optional(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  styleTags: z.array(z.string()).optional(),
  services: z.string().optional().nullable(),
  constraints: z.string().optional().nullable(),
})

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

// 全プロフィール取得
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const profiles = await prisma.vendorProfile.findMany({
      where: { vendorId: session.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Vendor profiles GET error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 新規プロフィール作成
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'vendor') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createProfileSchema.parse(body)

    // デフォルトプロフィールを設定する場合、既存のデフォルトを解除
    if (data.name === 'デフォルトプロフィール' || body.isDefault) {
      await prisma.vendorProfile.updateMany({
        where: {
          vendorId: session.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const profile = await prisma.vendorProfile.create({
      data: {
        vendorId: session.id,
        name: data.name,
        imageUrl: data.imageUrl,
        isDefault: body.isDefault || false,
        areas: data.areas || [],
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        styleTags: data.styleTags || [],
        services: data.services,
        constraints: data.constraints,
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
    console.error('Vendor profile POST error:', error)
    return NextResponse.json(
      { error: '作成に失敗しました' },
      { status: 500 }
    )
  }
}
