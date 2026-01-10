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
  vendor: {
    id: string
    name: string
    profile: {
      areas: string[]
    } | null
  }
  category: {
    name: string
  } | null
  messages: Array<{
    id: string
    body: string
    createdAt: string
  }>
}

export default function CoupleInquiriesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInquiries()
  }, [])

  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries?type=couple')
      if (res.status === 401) {
        router.push('/couple/login')
        return
      }
      if (!res.ok) {
        throw new Error('問い合わせの取得に失敗しました')
      }
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch (error) {
      console.error('Failed to load inquiries:', error)
      alert('問い合わせの取得に失敗しました')
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
        <div className="mb-6">
          <Link
            href="/couple/plan"
            className="text-pink-600 hover:text-pink-700 font-medium mb-4 inline-block"
          >
            ← PlanBoardに戻る
          </Link>
        </div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">問い合わせ一覧</h1>
          <Link
            href="/search"
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            ベンダーを探す
          </Link>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">問い合わせはまだありません</p>
            <Link
              href="/search"
              className="inline-block px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              ベンダーを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <Link
                key={inquiry.id}
                href={`/couple/inquiries/${inquiry.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inquiry.vendor.name}
                      </h3>
                      {inquiry.category && (
                        <span className="text-sm text-gray-600">
                          {inquiry.category.name}
                        </span>
                      )}
                    </div>
                    {inquiry.message && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {inquiry.message}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {inquiry.weddingDate && (
                        <span>
                          希望日: {new Date(inquiry.weddingDate).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                      {inquiry.area && <span>エリア: {inquiry.area}</span>}
                      {inquiry.guestCount && <span>人数: {inquiry.guestCount}名</span>}
                      {inquiry.budgetRangeMin && inquiry.budgetRangeMax && (
                        <span>
                          予算: ¥{inquiry.budgetRangeMin.toLocaleString()}〜¥
                          {inquiry.budgetRangeMax.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        inquiry.status
                      )}`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(inquiry.createdAt).toLocaleString('ja-JP')}
                    </div>
                    {inquiry.messages.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {inquiry.messages.length}件のメッセージ
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

