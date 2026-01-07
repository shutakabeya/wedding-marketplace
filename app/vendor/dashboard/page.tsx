'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface Inquiry {
  id: string
  status: string
  message: string | null
  weddingDate: string | null
  area: string | null
  guestCount: number | null
  budgetRangeMin: number | null
  budgetRangeMax: number | null
  createdAt: string
  couple: {
    name: string
  }
  category: {
    name: string
  } | null
}

interface DashboardStats {
  totalInquiries: number
  newInquiries: number
  proposingInquiries: number
  contractedInquiries: number
  completedInquiries: number
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // 問い合わせ一覧を取得
      const res = await fetch('/api/inquiries?type=vendor')
      if (res.status === 401) {
        router.push('/vendor/login')
        return
      }
      if (!res.ok) {
        throw new Error('データの取得に失敗しました')
      }
      const data = await res.json()
      const inquiries: Inquiry[] = data.inquiries || []

      // 統計を計算
      const stats: DashboardStats = {
        totalInquiries: inquiries.length,
        newInquiries: inquiries.filter((i) => i.status === 'new').length,
        proposingInquiries: inquiries.filter((i) => i.status === 'proposing').length,
        contractedInquiries: inquiries.filter((i) => i.status === 'contracted').length,
        completedInquiries: inquiries.filter((i) => i.status === 'completed').length,
      }

      setStats(stats)
      setRecentInquiries(inquiries.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: '新規',
      proposing: '提案中',
      contracted: '成約',
      declined: '辞退',
      completed: '完了',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      proposing: 'bg-yellow-100 text-yellow-700',
      contracted: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <div className="flex gap-4">
            <Link
              href="/vendor/profile"
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              プロフィール編集
            </Link>
            <Link
              href="/vendor/inquiries"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              問い合わせ一覧
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">総問い合わせ数</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalInquiries}</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <div className="text-sm text-blue-600 mb-1">新規</div>
              <div className="text-3xl font-bold text-blue-700">{stats.newInquiries}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-md p-6">
              <div className="text-sm text-yellow-600 mb-1">提案中</div>
              <div className="text-3xl font-bold text-yellow-700">{stats.proposingInquiries}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-6">
              <div className="text-sm text-green-600 mb-1">成約</div>
              <div className="text-3xl font-bold text-green-700">{stats.contractedInquiries}</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">完了</div>
              <div className="text-3xl font-bold text-gray-700">{stats.completedInquiries}</div>
            </div>
          </div>
        )}

        {/* 最近の問い合わせ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">最近の問い合わせ</h2>
            <Link
              href="/vendor/inquiries"
              className="text-pink-600 hover:underline text-sm"
            >
              すべて見る →
            </Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              問い合わせはまだありません
            </div>
          ) : (
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/vendor/inquiries/${inquiry.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {inquiry.couple.name} 様
                      </div>
                      {inquiry.category && (
                        <div className="text-sm text-gray-600">
                          カテゴリ: {inquiry.category.name}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        inquiry.status
                      )}`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>
                  {inquiry.message && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {inquiry.message}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {inquiry.weddingDate && (
                      <span>希望日: {new Date(inquiry.weddingDate).toLocaleDateString('ja-JP')}</span>
                    )}
                    {inquiry.area && <span>エリア: {inquiry.area}</span>}
                    {inquiry.guestCount && <span>人数: {inquiry.guestCount}名</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(inquiry.createdAt).toLocaleString('ja-JP')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
