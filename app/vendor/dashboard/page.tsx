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
  const [guideOpen, setGuideOpen] = useState(true)

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
              ダッシュボード
            </span>
          </h1>
          <div className="flex gap-4">
            <Link
              href="/vendor/profile"
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              プロフィール編集
            </Link>
            <Link
              href="/vendor/inquiries"
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
            >
              問い合わせ一覧
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8 fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">総問い合わせ数</div>
              <div className="text-4xl font-bold text-gray-900">{stats.totalInquiries}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200 hover:shadow-2xl transition-shadow">
              <div className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wider">新規</div>
              <div className="text-4xl font-bold text-blue-700">{stats.newInquiries}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-xl p-6 border border-yellow-200 hover:shadow-2xl transition-shadow">
              <div className="text-sm font-semibold text-yellow-600 mb-2 uppercase tracking-wider">提案中</div>
              <div className="text-4xl font-bold text-yellow-700">{stats.proposingInquiries}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200 hover:shadow-2xl transition-shadow">
              <div className="text-sm font-semibold text-green-600 mb-2 uppercase tracking-wider">成約</div>
              <div className="text-4xl font-bold text-green-700">{stats.contractedInquiries}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-shadow">
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">完了</div>
              <div className="text-4xl font-bold text-gray-700">{stats.completedInquiries}</div>
            </div>
          </div>
        )}

        {/* サプライヤー向けガイド */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-md p-6 mb-8 border border-pink-200">
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full flex justify-between items-center text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-pink-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              サプライヤー向けガイド
            </h2>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {guideOpen && (
            <div className="mt-4 space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. プロフィールの充実</h3>
                <p className="text-sm leading-relaxed">
                  まずは「プロフィール編集」から、あなたのサービスを魅力的に紹介しましょう。写真やギャラリーを追加し、価格設定を明確にすることで、カップルからの問い合わせが増えます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. 問い合わせへの迅速な対応</h3>
                <p className="text-sm leading-relaxed">
                  カップルからの問い合わせが届いたら、できるだけ早く返信することが大切です。「問い合わせ一覧」から各問い合わせを確認し、詳細ページでメッセージを送信できます。新規問い合わせには特に注意を払いましょう。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. 提案の作成とステータス管理</h3>
                <p className="text-sm leading-relaxed">
                  問い合わせに対して具体的な提案を送信し、ステータスを「提案中」に更新します。カップルが興味を示したら、詳細な打ち合わせを進め、成約につなげていきましょう。ステータスは適切に更新することで、進捗を管理できます。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. ダッシュボードの活用</h3>
                <p className="text-sm leading-relaxed">
                  このダッシュボードでは、問い合わせの統計情報と最近の問い合わせを一目で確認できます。新規・提案中・成約・完了の各ステータスを把握し、効率的に業務を進めましょう。
                </p>
              </div>
              <div className="pt-2 border-t border-pink-200">
                <p className="text-xs text-gray-600">
                  💡 ヒント: 定期的にプロフィールを更新し、最新の情報を提供することで、カップルからの信頼を得られます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 最近の問い合わせ */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">最近の問い合わせ</h2>
            <Link
              href="/vendor/inquiries"
              className="text-pink-600 hover:text-pink-700 hover:underline text-sm font-semibold transition-colors"
            >
              すべて見る →
            </Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 font-medium">問い合わせはまだありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/vendor/inquiries/${inquiry.id}`}
                  className="block p-6 border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50/50 transition-all hover:shadow-lg group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-gray-900 group-hover:text-pink-600 transition-colors">
                        {inquiry.couple.name} 様
                      </div>
                      {inquiry.category && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {inquiry.category.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(
                        inquiry.status
                      )}`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>
                  {inquiry.message && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                      {inquiry.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                    {inquiry.weddingDate && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        希望日: {new Date(inquiry.weddingDate).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                    {inquiry.area && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        エリア: {inquiry.area}
                      </span>
                    )}
                    {inquiry.guestCount && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        人数: {inquiry.guestCount}名
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
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
