'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface ThreadMessage {
  id: string
  senderType: string
  senderId: string
  body: string
  attachments: string[]
  createdAt: string
}

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
  messages: ThreadMessage[]
}

export default function VendorInquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadInquiry()
  }, [params.id])

  const loadInquiry = async () => {
    try {
      const res = await fetch(`/api/inquiries/${params.id}`)
      if (res.status === 401) {
        router.push('/vendor/login')
        return
      }
      if (!res.ok) {
        throw new Error('問い合わせの取得に失敗しました')
      }
      const data = await res.json()
      setInquiry(data.inquiry)
    } catch (error) {
      console.error('Failed to load inquiry:', error)
      alert('問い合わせの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const res = await fetch(`/api/inquiries/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message }),
      })

      if (!res.ok) {
        throw new Error('メッセージの送信に失敗しました')
      }

      setMessage('')
      await loadInquiry()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('メッセージの送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm('ステータスを変更しますか？')) return

    try {
      const res = await fetch(`/api/inquiries/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('ステータスの更新に失敗しました')
      }

      await loadInquiry()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('ステータスの更新に失敗しました')
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

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">問い合わせが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/vendor/inquiries" className="text-pink-600 hover:underline">
            ← 問い合わせ一覧に戻る
          </Link>
        </div>

        {/* 問い合わせ情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {inquiry.couple.name} 様からの問い合わせ
              </h1>
              {inquiry.category && (
                <span className="text-sm text-gray-600">カテゴリ: {inquiry.category.name}</span>
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

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {inquiry.weddingDate && (
              <div>
                <span className="text-gray-600">希望日:</span>{' '}
                <span className="font-medium">
                  {new Date(inquiry.weddingDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
            {inquiry.area && (
              <div>
                <span className="text-gray-600">エリア:</span>{' '}
                <span className="font-medium">{inquiry.area}</span>
              </div>
            )}
            {inquiry.guestCount && (
              <div>
                <span className="text-gray-600">人数:</span>{' '}
                <span className="font-medium">{inquiry.guestCount}名</span>
              </div>
            )}
            {inquiry.budgetRangeMin && inquiry.budgetRangeMax && (
              <div>
                <span className="text-gray-600">予算:</span>{' '}
                <span className="font-medium">
                  ¥{inquiry.budgetRangeMin.toLocaleString()}〜¥
                  {inquiry.budgetRangeMax.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* ステータス変更ボタン */}
          <div className="mt-4 flex gap-2">
            {inquiry.status === 'new' && (
              <button
                onClick={() => handleStatusChange('proposing')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                提案中にする
              </button>
            )}
            {inquiry.status === 'proposing' && (
              <>
                <button
                  onClick={() => handleStatusChange('contracted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  成約にする
                </button>
                <button
                  onClick={() => handleStatusChange('declined')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  辞退する
                </button>
              </>
            )}
            {inquiry.status === 'contracted' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                完了にする
              </button>
            )}
          </div>
        </div>

        {/* メッセージスレッド */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">メッセージ</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inquiry.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.senderType === 'couple'
                    ? 'bg-pink-50 ml-8'
                    : msg.senderType === 'vendor'
                    ? 'bg-blue-50 mr-8'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">
                    {msg.senderType === 'couple'
                      ? inquiry.couple.name + ' 様'
                      : msg.senderType === 'vendor'
                      ? 'あなた'
                      : '管理者'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleString('ja-JP')}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2">
                    {msg.attachments.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`添付画像 ${idx + 1}`}
                        className="max-w-xs rounded mt-2"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* メッセージ送信フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">メッセージを送信</h2>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="メッセージを入力..."
              required
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 disabled:opacity-50"
            >
              {sending ? '送信中...' : '送信'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

