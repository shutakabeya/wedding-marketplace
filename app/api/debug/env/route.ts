import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // デバッグ用：環境変数が正しく読み込まれているか確認
  // 本番環境では削除することを推奨
  
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const databaseUrlLength = process.env.DATABASE_URL?.length || 0
  const databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) || 'not set'
  const databaseUrlSuffix = process.env.DATABASE_URL?.substring(databaseUrlLength - 30) || ''
  
  // セキュリティのため、パスワード部分は非表示
  const maskedUrl = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
    : 'not set'
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasDatabaseUrl,
    databaseUrlLength,
    databaseUrlPrefix,
    databaseUrlSuffix,
    maskedUrl,
    timestamp: new Date().toISOString(),
  })
}
