import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const { id } = await params

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedById: session.id,
      },
    })

    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Vendor approve error:', error)
    return NextResponse.json(
      { error: '承認に失敗しました' },
      { status: 500 }
    )
  }
}
