'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { AREAS, ALL_SELECTABLE_AREAS } from '@/lib/areas'

interface Category {
  id: string
  name: string
}

interface PlanResult {
  planType: 'balanced' | 'priority' | 'budget'
  venue: {
    selectedVenueId: string
    selectedProfileId: string
    alternativeVenueIds: string[]
    estimatedPrice: {
      min: number
      mid: number
      max: number
    }
  }
  plannerType: string
  plannerCost: {
    min: number
    mid: number
    max: number
  }
  categoryAllocations: Array<{
    categoryId: string
    categoryName: string
    allocatedMin: number
    allocatedMid: number
    allocatedMax: number
  }>
  categoryVendorCandidates: Record<string, Array<{
    vendorId: string
    profileId: string
    name: string
    priceMin: number | null
    priceMax: number | null
    actualPrice: number | null
    plans?: Array<{ name: string; price: number; description?: string }>
  }>>
  totals: {
    totalMin: number
    totalMid: number
    totalMax: number
  }
}

export default function WeddingGeniePage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'results' | 'saved'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 入力フォーム
  const [area, setArea] = useState('')
  const [guestCount, setGuestCount] = useState<number>(30)
  const [totalBudget, setTotalBudget] = useState<number>(500000)
  const [excludedCategories, setExcludedCategories] = useState<string[]>([])
  const [priorityCategories, setPriorityCategories] = useState<string[]>([])
  const [plannerType, setPlannerType] = useState<'planner' | 'day_of' | 'self' | 'undecided'>('undecided')

  // カテゴリ一覧
  const [categories, setCategories] = useState<Category[]>([])
  const [plans, setPlans] = useState<PlanResult[]>([])
  const [inputSnapshot, setInputSnapshot] = useState<any>(null)
  const [venueInfo, setVenueInfo] = useState<{
    id: string
    name: string
    profileName: string | null
    imageUrl: string | null
  } | null>(null)

  useEffect(() => {
    // カテゴリ一覧を取得
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories.filter((c: Category) => c.name !== '会場'))
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err))
  }, [])

  const handleGenerate = async () => {
    if (!area) {
      setError('エリアを選択してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wedding-genie/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area,
          guestCount,
          totalBudget,
          excludedCategories,
          priorityCategories,
          plannerType,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        setError(data.error || 'プラン生成に失敗しました')
        return
      }

      setPlans(data.plans)
      setInputSnapshot(data.inputSnapshot)
      setVenueInfo(data.venueInfo || null)
      setStep('results')
      // ページ先頭にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError('プラン生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExcluded = (categoryName: string) => {
    setExcludedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const handleTogglePriority = (categoryName: string) => {
    setPriorityCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((c) => c !== categoryName)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, categoryName]
    })
  }

  const handleSavePlan = async (planIndex: number) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wedding-genie/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: `プラン${['A', 'B', 'C'][planIndex]}`,
          inputSnapshot,
          planData: plans[planIndex],
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        setError(data.error || '保存に失敗しました')
        return
      }

      alert('プランを保存しました')
    } catch (err) {
      setError('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterToPlanBoard = async (planIndex: number) => {
    // まず保存
    setLoading(true)
    setError('')

    try {
      // 保存
      const saveRes = await fetch('/api/wedding-genie/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: `プラン${['A', 'B', 'C'][planIndex]}`,
          inputSnapshot,
          planData: plans[planIndex],
        }),
      })

      const saveData = await saveRes.json()

      if (saveRes.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!saveRes.ok) {
        setError(saveData.error || '保存に失敗しました')
        return
      }

      // PlanBoardに登録
      const registerRes = await fetch(`/api/wedding-genie/plans/${saveData.plan.id}/register`, {
        method: 'POST',
      })

      const registerData = await registerRes.json()

      if (registerRes.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!registerRes.ok) {
        setError(registerData.error || 'PlanBoard登録に失敗しました')
        return
      }

      alert('PlanBoardに登録しました')
      router.push('/couple/plan')
    } catch (err) {
      setError('PlanBoard登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setStep('input')}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              ← 入力に戻る
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">生成されたプラン</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const planLabels = {
                balanced: { name: 'プランA', desc: 'バランス型（おすすめ）' },
                priority: { name: 'プランB', desc: '重視反映型' },
                budget: { name: 'プランC', desc: '節約型' },
              }
              const label = planLabels[plan.planType]

              return (
                <div
                  key={plan.planType}
                  className="bg-white rounded-lg shadow-lg p-6 border-2 border-pink-100"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{label.name}</h2>
                    <p className="text-sm text-gray-600">{label.desc}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">予算レンジ</h3>
                    <div className="text-sm text-gray-600">
                      <div>下限: {formatCurrency(plan.totals.totalMin)}</div>
                      <div>中央: {formatCurrency(plan.totals.totalMid)}</div>
                      <div>上限: {formatCurrency(plan.totals.totalMax)}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">会場</h3>
                    {venueInfo && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          {venueInfo.profileName || venueInfo.name}
                        </div>
                        {venueInfo.imageUrl && (
                          <img
                            src={venueInfo.imageUrl}
                            alt={venueInfo.profileName || venueInfo.name}
                            className="w-full h-32 object-cover rounded mt-2"
                          />
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {formatCurrency(plan.venue.estimatedPrice.mid)}（推定）
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">カテゴリ</h3>
                    <div className="space-y-2 text-sm">
                      {plan.categoryAllocations.map((alloc) => {
                        const vendors = plan.categoryVendorCandidates[alloc.categoryId] || []
                        const vendor = vendors[0]
                        // 実際の価格があればそれを使用、なければallocatedMidを使用
                        const displayPrice = vendor?.actualPrice ?? alloc.allocatedMid

                        return (
                          <div key={alloc.categoryId} className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[100px] flex-shrink-0">
                              {alloc.categoryName}:
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-medium">
                                {formatCurrency(displayPrice)}
                                {vendor?.plans && vendor.plans.length > 1 && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({vendor.plans.length}プラン)
                                  </span>
                                )}
                              </div>
                              {vendor && (
                                <div className="text-gray-500 text-xs mt-0.5 truncate">
                                  {vendor.name}
                                </div>
                              )}
                              {!vendor && (
                                <div className="text-gray-400 text-xs mt-0.5 italic">
                                  候補を検索中...
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleSavePlan(index)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium hover:bg-pink-200 transition-colors disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleRegisterToPlanBoard(index)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50"
                    >
                      PlanBoardに登録
                    </button>
                  </div>
                  <div className="mt-2">
                    <Link
                      href="/wedding-genie/saved"
                      className="text-sm text-pink-600 hover:text-pink-700"
                    >
                      保存したプランを見る →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wedding Genie</h1>
          <p className="text-gray-600 mb-8">
            最小入力で結婚式プランを自動生成します
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* エリア */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                エリア <span className="text-red-500">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">選択してください</option>
                {ALL_SELECTABLE_AREAS.map((a) => (
                  <option key={`${a.type}-${a.id}`} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 人数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                人数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                min={1}
                required
              />
              <div className="flex gap-2 mt-2">
                {[10, 30, 60, 100].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setGuestCount(count)}
                    className={`px-3 py-1 text-sm rounded ${
                      guestCount === count
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {count === 10 ? '〜10' : count === 30 ? '11〜30' : count === 60 ? '31〜60' : '61〜100'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setGuestCount(101)}
                  className={`px-3 py-1 text-sm rounded ${
                    guestCount >= 101
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  100+
                </button>
              </div>
            </div>

            {/* 予算 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算（総額） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                min={1}
                required
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[300000, 500000, 800000, 1200000, 1500000, 2000000, 3000000, 4000000, 5000000].map(
                  (budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => setTotalBudget(budget)}
                      className={`px-3 py-1 text-sm rounded ${
                        totalBudget === budget
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {budget / 10000}万
                    </button>
                  )
                )}
              </div>
            </div>

            {/* いらないカテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                いらないカテゴリ（任意）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={excludedCategories.includes(category.name)}
                      onChange={() => handleToggleExcluded(category.name)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 重視したいカテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重視したいカテゴリ（最大2つ、任意）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={priorityCategories.includes(category.name)}
                      onChange={() => handleTogglePriority(category.name)}
                      disabled={
                        !priorityCategories.includes(category.name) &&
                        priorityCategories.length >= 2
                      }
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* プランナー選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プランナー選択
              </label>
              <div className="space-y-2">
                {[
                  { value: 'planner', label: 'プランナー' },
                  { value: 'day_of', label: 'デイオブプランナー' },
                  { value: 'self', label: 'セルフ' },
                  { value: 'undecided', label: '後で決める' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="plannerType"
                      value={option.value}
                      checked={plannerType === option.value}
                      onChange={(e) =>
                        setPlannerType(e.target.value as 'planner' | 'day_of' | 'self' | 'undecided')
                      }
                      className="border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">
                      {option.label}
                      {option.value === 'undecided' && (
                        <span className="text-gray-500 text-xs ml-1">（仮）</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !area}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? '生成中...' : 'プランを作成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
