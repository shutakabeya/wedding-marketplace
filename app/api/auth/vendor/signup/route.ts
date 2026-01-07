import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, setSession } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

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
    const existing = await prisma.vendor.findUnique({
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

    // ベンダー作成（承認待ち状態）
    const vendor = await prisma.vendor.create({
      data: {
        email,
        passwordHash,
        name,
        status: 'pending',
      },
    })

    // セッション設定
    await setSession({
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      type: 'vendor',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        status: vendor.status,
      },
      message: '登録が完了しました。管理者の承認をお待ちください。',
    })
  } catch (error) {
    // 詳細なエラー情報をログに出力（デバッグ用）
    console.error('Signup error:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', error.meta)
    }
    
    return NextResponse.json(
      { 
        error: '登録に失敗しました',
        // 開発環境でのみエラー詳細を返す
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { details: error.message } : {})
      },
      { status: 500 }
    )
  }
}
