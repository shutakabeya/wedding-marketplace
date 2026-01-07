'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface DashboardStats {
  totalVendors: number
  pendingVendors: number
  approvedVendors: number
  totalInquiries: number
  newInquiries: number
  contractedInquiries: number
  totalCouples: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // ベンダー統計
      const vendorsRes = await fetch('/api/admin/vendors/pending')
      if (vendorsRes.status === 401 || vendorsRes.status === 403) {
        router.push('/admin/login')
        return
      }

      // 簡易的な統計取得（実際には専用APIを作成する方が良い）
      const pendingRes = await fetch('/api/admin/vendors/pending')
      const pendingData = await pendingRes.ok ? await pendingRes.json() : { vendors: [] }
      
      // 統計を計算（実際の実装では専用APIから取得）
      const stats: DashboardStats = {
        totalVendors: 0, // 実際の実装ではAPIから取得
        pendingVendors: pendingData.vendors?.length || 0,
        approvedVendors: 0, // 実際の実装ではAPIから取得
        totalInquiries: 0, // 実際の実装ではAPIから取得
        newInquiries: 0, // 実際の実装ではAPIから取得
        contractedInquiries: 0, // 実際の実装ではAPIから取得
        totalCouples: 0, // 実際の実装ではAPIから取得
      }

      setStats(stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">管理者ダッシュボード</h1>

        {/* クイックアクション */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/vendors/pending"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-sm text-gray-600 mb-1">承認待ちベンダー</div>
            <div className="text-3xl font-bold text-yellow-600">{stats?.pendingVendors || 0}</div>
            <div className="text-xs text-gray-500 mt-2">件</div>
          </Link>
          <Link
            href="/admin/vendors"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-sm text-gray-600 mb-1">全ベンダー管理</div>
            <div className="text-3xl font-bold text-blue-600">→</div>
            <div className="text-xs text-gray-500 mt-2">管理ページへ</div>
          </Link>
          <Link
            href="/admin/inquiries"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-sm text-gray-600 mb-1">問い合わせ監視</div>
            <div className="text-3xl font-bold text-pink-600">→</div>
            <div className="text-xs text-gray-500 mt-2">監視ページへ</div>
          </Link>
        </div>

        {/* 統計カード */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">総ベンダー数</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalVendors}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">承認済み</div>
              <div className="text-3xl font-bold text-green-600">{stats.approvedVendors}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">総問い合わせ数</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalInquiries}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">総カップル数</div>
              <div className="text-3xl font-bold text-pink-600">{stats.totalCouples}</div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">管理機能</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/admin/vendors/pending"
              className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <div className="font-semibold text-gray-900 mb-1">承認待ちベンダー審査</div>
              <div className="text-sm text-gray-600">
                新規登録されたベンダーの承認・否認を行います
              </div>
            </Link>
            <Link
              href="/admin/vendors"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="font-semibold text-gray-900 mb-1">全ベンダー管理</div>
              <div className="text-sm text-gray-600">
                登録済みベンダーの一覧表示・表示停止を行います
              </div>
            </Link>
            <Link
              href="/admin/inquiries"
              className="p-4 border-2 border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <div className="font-semibold text-gray-900 mb-1">問い合わせ監視</div>
              <div className="text-sm text-gray-600">
                すべての問い合わせを閲覧・介入できます
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
