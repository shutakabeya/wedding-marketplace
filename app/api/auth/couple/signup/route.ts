import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, setSession } from '@/lib/auth'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = signupSchema.parse(body)

    // 既存ユーザーチェック
    const existing = await prisma.couple.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザー作成
    const couple = await prisma.couple.create({
      data: {
        email,
        passwordHash,
        name,
      },
    })

    // セッション設定
    await setSession({
      id: couple.id,
      email: couple.email,
      name: couple.name,
      type: 'couple',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: couple.id,
        email: couple.email,
        name: couple.name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: '登録に失敗しました' },
      { status: 500 }
    )
  }
}
