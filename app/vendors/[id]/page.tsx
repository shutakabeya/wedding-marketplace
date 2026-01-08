'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string // 屋号
  bio: string | null
  logoUrl: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    name: string | null // 出品名（プラン名）
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

function VendorDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profileId')
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    loadVendor()
    loadPlanBoardSlots()
  }, [params.id, profileId])

  const loadVendor = async () => {
    try {
      const url = profileId 
        ? `/api/vendors/${params.id}?profileId=${profileId}`
        : `/api/vendors/${params.id}`
      const res = await fetch(url)
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダーセクション（プロフィール画像とロゴ） */}
        <div className="mb-8 fade-in">
          {vendor.profile?.imageUrl && (
            <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl mb-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vendor.profile.imageUrl}
                alt={vendor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <div className="flex items-center gap-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {vendor.logoUrl && (
              <div className="relative w-28 h-28 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vendor.logoUrl}
                  alt={`${vendor.name}ロゴ`}
                  className="w-full h-full object-cover rounded-full border-4 border-pink-200 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                {vendor.profile?.name || vendor.name}
              </h1>
              {vendor.profile?.name && (
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-semibold text-gray-600">屋号：</span>
                  {vendor.name}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {vendor.categories.map((c) => (
                  <span key={c.category.name} className="px-3 py-1 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full text-sm font-medium border border-pink-200">
                    {c.category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* ギャラリー */}
            {vendor.gallery.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  実績写真
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.gallery.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300 shadow-lg"
                      onClick={() => setLightboxImage(image.imageUrl)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.imageUrl}
                        alt={image.caption || `${vendor.name}の写真 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 説明 */}
            {vendor.bio && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">{vendor.bio}</p>
              </div>
            )}

            {/* 提供内容 */}
            {vendor.profile?.services && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">提供内容</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{vendor.profile.services}</p>
              </div>
            )}

            {/* 制約 */}
            {vendor.profile?.constraints && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">制約・注意事項</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{vendor.profile.constraints}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h2>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">カテゴリ</div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {vendor.categories.map((c) => c.category.name).join(', ')}
                  </div>
                </div>
                {vendor.profile?.areas && vendor.profile.areas.length > 0 && (
                  <div className="pb-4 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      対応エリア
                    </div>
                    <div className="font-semibold text-gray-900">{vendor.profile.areas.join(', ')}</div>
                  </div>
                )}
                {vendor.profile && (
                  <div className="pb-4 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">価格目安</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
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
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">テイスト</div>
                    <div className="flex flex-wrap gap-2">
                      {vendor.profile.styleTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 rounded-full text-sm font-medium border border-pink-200"
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
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">PlanBoardに追加</h2>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  このベンダーをPlanBoardの候補として追加できます
                </p>
                <div className="space-y-3">
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
                        className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                      >
                        {addingToPlanBoard ? '追加中...' : `${vc.category.name}に追加`}
                      </button>
                    )
                  })}
                </div>
                {vendor.categories.every(
                  (vc) => !planBoardSlots.find((s) => s.category.name === vc.category.name)
                ) && (
                  <p className="text-sm text-gray-500 mt-4">
                    このベンダーのカテゴリに対応するスロットがありません
                  </p>
                )}
              </div>
            )}

            {/* 問い合わせフォーム */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">問い合わせ</h2>
              <form onSubmit={handleSubmitInquiry} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    希望日
                  </label>
                  <input
                    type="date"
                    value={inquiryForm.weddingDate}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, weddingDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    エリア
                  </label>
                  <input
                    type="text"
                    value={inquiryForm.area}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, area: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                    placeholder="例: 東京都"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    人数
                  </label>
                  <input
                    type="number"
                    value={inquiryForm.guestCount}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, guestCount: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                    placeholder="例: 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    予算感
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      value={inquiryForm.budgetRangeMin}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, budgetRangeMin: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                      placeholder="最低"
                    />
                    <span className="text-gray-500 font-medium">〜</span>
                    <input
                      type="number"
                      value={inquiryForm.budgetRangeMax}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, budgetRangeMax: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                      placeholder="最高"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    メッセージ
                  </label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, message: e.target.value })
                    }
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none resize-none"
                    placeholder="ご希望の内容をお聞かせください"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      送信中...
                    </span>
                  ) : (
                    '問い合わせを送信'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ライトボックス */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="拡大画像"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm">読み込み中...</div>
      </div>
    }>
      <VendorDetailContent />
    </Suspense>
  )
}
