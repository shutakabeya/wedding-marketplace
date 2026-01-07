'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    imageUrl: string | null
    areas: string[]
    priceMin: number | null
    priceMax: number | null
    styleTags: string[]
    services: string | null
    constraints: string | null
  } | null
  gallery: Array<{ id: string; imageUrl: string; caption: string | null }>
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [inquiryForm, setInquiryForm] = useState({
    message: '',
    weddingDate: '',
    area: '',
    guestCount: '',
    budgetRangeMin: '',
    budgetRangeMax: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [planBoardSlots, setPlanBoardSlots] = useState<Array<{ id: string; category: { id: string; name: string } }>>([])
  const [addingToPlanBoard, setAddingToPlanBoard] = useState(false)

  useEffect(() => {
    loadVendor()
    loadPlanBoardSlots()
  }, [params.id])

  const loadVendor = async () => {
    try {
      const res = await fetch(`/api/vendors/${params.id}`)
      if (!res.ok) {
        throw new Error('ベンダーが見つかりません')
      }
      const data = await res.json()
      setVendor(data.vendor)
    } catch (error) {
      console.error('Failed to load vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanBoardSlots = async () => {
    try {
      const res = await fetch('/api/plan-board')
      if (res.status === 401) {
        // ログインしていない場合はスロットを表示しない
        return
      }
      if (!res.ok) return
      const data = await res.json()
      if (data.planBoard?.slots) {
        setPlanBoardSlots(data.planBoard.slots)
      }
    } catch (error) {
      // エラーは無視（ログインしていない場合など）
    }
  }

  const handleAddToPlanBoard = async (slotId: string) => {
    if (!vendor) return
    setAddingToPlanBoard(true)
    try {
      const res = await fetch(`/api/plan-board/slots/${slotId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 401) {
          router.push('/couple/login')
          return
        }
        alert(data.error || 'PlanBoardへの追加に失敗しました')
        return
      }

      alert('PlanBoardに追加しました')
      router.push('/couple/plan')
    } catch (error) {
      console.error('Failed to add to plan board:', error)
      alert('PlanBoardへの追加に失敗しました')
    } finally {
      setAddingToPlanBoard(false)
    }
  }

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor?.id,
          message: inquiryForm.message,
          weddingDate: inquiryForm.weddingDate || undefined,
          area: inquiryForm.area || undefined,
          guestCount: inquiryForm.guestCount ? parseInt(inquiryForm.guestCount) : undefined,
          budgetRangeMin: inquiryForm.budgetRangeMin ? parseInt(inquiryForm.budgetRangeMin) : undefined,
          budgetRangeMax: inquiryForm.budgetRangeMax ? parseInt(inquiryForm.budgetRangeMax) : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 401) {
          router.push('/couple/login')
          return
        }
        alert(data.error || '問い合わせの送信に失敗しました')
        return
      }

      alert('問い合わせを送信しました')
      setInquiryForm({
        message: '',
        weddingDate: '',
        area: '',
        guestCount: '',
        budgetRangeMin: '',
        budgetRangeMax: '',
      })
    } catch (error) {
      console.error('Failed to submit inquiry:', error)
      alert('問い合わせの送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-sm">ベンダーが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダーセクション（プロフィール画像とロゴ） */}
        <div className="mb-6">
          {vendor.profile?.imageUrl && (
            <img
              src={vendor.profile.imageUrl}
              alt={vendor.name}
              className="w-full h-80 object-cover rounded-lg mb-4 shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          )}
          <div className="flex items-center gap-4">
            {vendor.logoUrl && (
              <img
                src={vendor.logoUrl}
                alt={`${vendor.name}ロゴ`}
                className="w-24 h-24 object-cover rounded-full border-4 border-pink-200 shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{vendor.name}</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* ギャラリー */}
            {vendor.gallery.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">実績写真</h2>
                <div className="grid grid-cols-2 gap-4">
                  {vendor.gallery.map((image) => (
                    <img
                      key={image.id}
                      src={image.imageUrl}
                      alt={image.caption || vendor.name}
                      className="w-full h-48 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 説明 */}
            {vendor.bio && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">プロフィール</h2>
                <p className="text-gray-700 whitespace-pre-line">{vendor.bio}</p>
              </div>
            )}

            {/* 提供内容 */}
            {vendor.profile?.services && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">提供内容</h2>
                <p className="text-gray-700 whitespace-pre-line">{vendor.profile.services}</p>
              </div>
            )}

            {/* 制約 */}
            {vendor.profile?.constraints && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">制約・注意事項</h2>
                <p className="text-gray-700 whitespace-pre-line">{vendor.profile.constraints}</p>
              </div>
            )}
          </div>

          <div>
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">基本情報</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">カテゴリ</div>
                  <div className="font-medium">
                    {vendor.categories.map((c) => c.category.name).join(', ')}
                  </div>
                </div>
                {vendor.profile?.areas && vendor.profile.areas.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">対応エリア</div>
                    <div className="font-medium">{vendor.profile.areas.join(', ')}</div>
                  </div>
                )}
                {vendor.profile && (
                  <div>
                    <div className="text-sm text-gray-600">価格目安</div>
                    <div className="font-medium text-pink-600">
                      {vendor.profile.priceMin && (
                        <>¥{vendor.profile.priceMin.toLocaleString()}〜</>
                      )}
                      {vendor.profile.priceMax && (
                        <>¥{vendor.profile.priceMax.toLocaleString()}</>
                      )}
                    </div>
                  </div>
                )}
                {vendor.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">テイスト</div>
                    <div className="flex flex-wrap gap-2">
                      {vendor.profile.styleTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PlanBoardに追加 */}
            {planBoardSlots.length > 0 && vendor && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">PlanBoardに追加</h2>
                <p className="text-sm text-gray-600 mb-3">
                  このベンダーをPlanBoardの候補として追加できます
                </p>
                <div className="space-y-2">
                  {vendor.categories.map((vc) => {
                    const slot = planBoardSlots.find(
                      (s) => s.category.name === vc.category.name
                    )
                    if (!slot) return null
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleAddToPlanBoard(slot.id)}
                        disabled={addingToPlanBoard}
                        className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {addingToPlanBoard ? '追加中...' : `${vc.category.name}に追加`}
                      </button>
                    )
                  })}
                </div>
                {vendor.categories.every(
                  (vc) => !planBoardSlots.find((s) => s.category.name === vc.category.name)
                ) && (
                  <p className="text-sm text-gray-500">
                    このベンダーのカテゴリに対応するスロットがありません
                  </p>
                )}
              </div>
            )}

            {/* 問い合わせフォーム */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">問い合わせ</h2>
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    希望日
                  </label>
                  <input
                    type="date"
                    value={inquiryForm.weddingDate}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, weddingDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    エリア
                  </label>
                  <input
                    type="text"
                    value={inquiryForm.area}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, area: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例: 東京都"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    人数
                  </label>
                  <input
                    type="number"
                    value={inquiryForm.guestCount}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, guestCount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例: 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予算感
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={inquiryForm.budgetRangeMin}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, budgetRangeMin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="最低"
                    />
                    <span className="self-center">〜</span>
                    <input
                      type="number"
                      value={inquiryForm.budgetRangeMax}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, budgetRangeMax: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="最高"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メッセージ
                  </label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, message: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="ご希望の内容をお聞かせください"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {submitting ? '送信中...' : '問い合わせを送信'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
