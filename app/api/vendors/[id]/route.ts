import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const profileId = searchParams.get('profileId')

    // ベンダー情報を取得
    const vendorData = await prisma.vendor.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        gallery: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!vendorData) {
      return NextResponse.json(
        { error: 'ベンダーが見つかりません' },
        { status: 404 }
      )
    }

    // プロフィールIDが指定されている場合は該当プロフィールを取得、そうでなければデフォルトプロフィールを取得
    let profile = null
    if (profileId) {
      // 指定されたプロフィールIDがこのベンダーに属しているか確認
      profile = await prisma.vendorProfile.findFirst({
        where: {
          id: profileId,
          vendorId: id,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      })
      
      if (!profile) {
        console.error(`Profile not found: vendorId=${id}, profileId=${profileId}`)
        return NextResponse.json(
          { error: 'プロフィールが見つかりません' },
          { status: 404 }
        )
      }
      
      console.log(`Found profile: id=${profile.id}, name=${profile.name}, isDefault=${profile.isDefault}, vendorId=${profile.vendorId}`)
    } else {
      // デフォルトプロフィールを取得
      profile = await prisma.vendorProfile.findFirst({
        where: {
          vendorId: id,
          isDefault: true,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      })
      
      if (profile) {
        console.log(`Found default profile: id=${profile.id}, name=${profile.name}, vendorId=${profile.vendorId}`)
      } else {
        console.log(`No default profile found for vendorId=${id}`)
      }
    }

    // 指定されたプロフィールまたはデフォルトプロフィールを返す
    // プロフィール情報を明示的に設定（必要なフィールドをすべて含める）
    const vendor = {
      id: vendorData.id,
      name: vendorData.name,
      bio: vendorData.bio,
      logoUrl: vendorData.logoUrl,
      categories: vendorData.categories,
      gallery: vendorData.gallery,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        imageUrl: profile.imageUrl,
        profileImages: profile.profileImages || [],
        priceMin: profile.priceMin,
        priceMax: profile.priceMax,
        areas: profile.areas || [],
        styleTags: profile.styleTags || [],
        services: profile.services,
        constraints: profile.constraints,
        access: profile.access,
        categoryType: profile.categoryType,
        maxGuests: profile.maxGuests,
        serviceTags: profile.serviceTags || [],
        plans: profile.plans,
        categories: profile.categories,
        inquiryTemplateMessage: profile.inquiryTemplateMessage,
      } : null,
    }

    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Vendor detail error:', error)
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    )
  }
}
