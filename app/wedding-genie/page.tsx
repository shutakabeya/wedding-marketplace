'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { AREAS, ALL_SELECTABLE_AREAS } from '@/lib/areas'
import { GenieCandidateCarousel } from '@/components/GenieCandidateCarousel'

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
  const [plan, setPlan] = useState<PlanResult | null>(null)
  const [plans, setPlans] = useState<PlanResult[]>([]) // 後方互換性のため残す
  const [inputSnapshot, setInputSnapshot] = useState<any>(null)
  // 選択された候補を管理（vendorId-profileIdの形式）
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  // プラン保存用の状態
  const [savingPlan, setSavingPlan] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [planName, setPlanName] = useState('')

  useEffect(() => {
    // カテゴリ一覧を取得（会場も含む）
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories) // 会場も含める
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

      // 新しいAPI形式（plan）と旧形式（plans）の両方に対応
      const planData = data.plan || data.plans?.[0]
      if (planData) {
        setPlan(planData)
      }
      setPlans(data.plans || [planData].filter(Boolean))
      setInputSnapshot(data.inputSnapshot)
      setSelectedCandidates(new Set()) // 選択をリセット
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


  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '価格要問い合わせ'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // UUID分割用のヘルパー関数（コンポーネント全体で使用可能）
  const parseCandidateKey = (key: string): { vendorId: string; profileId: string } | null => {
    // UUIDは36文字（8-4-4-4-12）なので、最初の36文字がvendorId、その後のハイフンから最後までがprofileId
    // 形式: vendorId-profileId (vendorIdは36文字、その後にハイフン、その後profileId)
    const uuidLength = 36
    if (key.length <= uuidLength + 1) { // +1はハイフン
      console.warn(`Invalid key format: ${key}`)
      return null
    }
    const vendorId = key.substring(0, uuidLength)
    const profileId = key.substring(uuidLength + 1) // +1はハイフンをスキップ
    return { vendorId, profileId }
  }

  const handleCandidateSelect = (vendorId: string, profileId: string, selected: boolean) => {
    setSelectedCandidates((prev) => {
      const newSet = new Set(prev)
      const key = `${vendorId}-${profileId}`
      if (selected) {
        newSet.add(key)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
  }

  const handleSavePlan = async () => {
    if (!plan || !inputSnapshot) {
      setError('プランが生成されていません')
      return
    }

    setSavingPlan(true)
    setError('')

    try {
      const res = await fetch('/api/wedding-genie/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: planName || null,
          inputSnapshot,
          planData: plan,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        console.error('Save failed:', data)
        setError(data.error || 'プランの保存に失敗しました')
        return
      }

      alert('プランを保存しました')
      setShowSaveDialog(false)
      setPlanName('')
    } catch (err) {
      setError('プランの保存に失敗しました')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleRegisterSelected = async () => {
    if (!plan || selectedCandidates.size === 0) {
      setError('候補を選択してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 選択された候補を整形
      // plan.categoryVendorCandidatesのすべてのカテゴリIDとcategoryAllocationsから直接候補を検索
      const selectedCandidatesList: Array<{
        categoryId: string
        vendorId: string
        profileId: string
        estimatedCost: number | null
      }> = []

      console.log('Selected candidates keys:', Array.from(selectedCandidates))
      console.log('Plan categoryVendorCandidates keys:', Object.keys(plan.categoryVendorCandidates))
      console.log('Plan categoryAllocations:', plan.categoryAllocations.map(a => ({ id: a.categoryId, name: a.categoryName })))

      // カテゴリIDのマッピングを作成（categoryAllocationsとcategoryVendorCandidatesから）
      const categoryIdMap = new Map<string, string>() // categoryId -> categoryName
      for (const alloc of plan.categoryAllocations) {
        categoryIdMap.set(alloc.categoryId, alloc.categoryName)
      }
      
      // categoryVendorCandidatesのすべてのキーを確認
      for (const categoryId of Object.keys(plan.categoryVendorCandidates)) {
        if (!categoryIdMap.has(categoryId)) {
          // categoryAllocationsにない場合は、カテゴリ名を取得する必要がある
          // この場合は、categoriesから取得するか、categoryIdをそのまま使用
          const category = categories.find(c => c.id === categoryId)
          if (category) {
            categoryIdMap.set(categoryId, category.name)
          }
        }
      }

      let selectedVenueData: {
        selectedVenueId: string
        selectedProfileId: string
        estimatedPrice: number
      } | null = null
      let venueCategoryId: string | null = null

      // 会場カテゴリIDを特定
      for (const [categoryId, categoryName] of categoryIdMap.entries()) {
        if (categoryName === '会場') {
          venueCategoryId = categoryId
          break
        }
      }

      for (const key of selectedCandidates) {
        const parsed = parseCandidateKey(key)
        if (!parsed) {
          console.warn(`Failed to parse key: ${key}`)
          continue
        }
        const { vendorId, profileId } = parsed
        console.log(`Processing candidate: vendorId=${vendorId}, profileId=${profileId}`)
        
        let found = false
        
        // すべてのカテゴリをループして候補を検索
        for (const [categoryId, categoryCandidates] of Object.entries(plan.categoryVendorCandidates)) {
          const candidate = categoryCandidates.find(
            (c) => c.vendorId === vendorId && c.profileId === profileId
          )
          if (candidate) {
            const categoryName = categoryIdMap.get(categoryId) || '不明'
            console.log(`Found candidate for category ${categoryName} (${categoryId}):`, candidate)
            
            // 会場の場合は特別処理
            if (categoryId === venueCategoryId) {
              selectedVenueData = {
                selectedVenueId: candidate.vendorId,
                selectedProfileId: candidate.profileId,
                estimatedPrice: candidate.actualPrice || plan.venue.estimatedPrice.mid,
              }
            }
            
            // allocatedMidを取得（categoryAllocationsから）
            const alloc = plan.categoryAllocations.find(a => a.categoryId === categoryId)
            const estimatedCost = candidate.actualPrice || alloc?.allocatedMid || null
            
            selectedCandidatesList.push({
              categoryId: categoryId,
              vendorId: candidate.vendorId,
              profileId: candidate.profileId,
              estimatedCost: estimatedCost,
            })
            found = true
            break // 1つの候補は1つのカテゴリにしか属さない
          }
        }
        
        if (!found) {
          console.warn(`Candidate not found in any category: vendorId=${vendorId}, profileId=${profileId}`)
          console.warn('Available candidates:', Object.entries(plan.categoryVendorCandidates).map(([catId, cands]) => ({
            categoryId: catId,
            candidates: cands.map(c => ({ vendorId: c.vendorId, profileId: c.profileId }))
          })))
        }
      }

      console.log('Selected candidates list:', selectedCandidatesList.length, 'items')
      console.log('Selected candidates:', selectedCandidatesList)

      // 会場が選択されていない場合はデフォルトの会場を使用
      if (!selectedVenueData) {
        selectedVenueData = {
          selectedVenueId: plan.venue.selectedVenueId,
          selectedProfileId: plan.venue.selectedProfileId,
          estimatedPrice: plan.venue.estimatedPrice.mid,
        }
      }
      
      console.log('Final selectedCandidatesList length:', selectedCandidatesList.length)
      console.log('Venue data:', selectedVenueData)

      const res = await fetch('/api/wedding-genie/register-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCandidates: selectedCandidatesList,
          inputSnapshot,
          venueData: selectedVenueData,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        console.error('Registration failed:', data)
        setError(data.error || 'PlanBoard登録に失敗しました')
        return
      }

      const registeredCount = data.registeredCount || selectedCandidatesList.length
      console.log('Registration successful:', {
        registeredCount,
        selectedCandidatesListLength: selectedCandidatesList.length,
        message: data.message
      })
      
      if (registeredCount === 0) {
        setError('登録できる候補が見つかりませんでした')
        return
      }
      
      alert(data.message || `${registeredCount}件のベンダーをPlanBoardに登録しました`)
      router.push('/couple/plan')
    } catch (err) {
      setError('PlanBoard登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'results') {
    if (!plan) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600">プランが見つかりませんでした</p>
              <button
                onClick={() => setStep('input')}
                className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
              >
                ← 入力に戻る
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <button
              onClick={() => setStep('input')}
              className="text-pink-600 hover:text-pink-700 font-medium mb-4"
            >
              ← 入力に戻る
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  候補を比較して選ぶ
                </h1>
                <p className="text-gray-600">
                  各カテゴリの候補から気に入ったものを選択してください
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={loading || savingPlan}
                  className="px-6 py-3 bg-white border-2 border-pink-600 text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-all disabled:opacity-50 shadow-lg"
                >
                  プランを保存
                </button>
                {selectedCandidates.size > 0 && (
                  <button
                    onClick={handleRegisterSelected}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {selectedCandidates.size}件をPlanBoardに登録
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* 合計金額の表示（選択された候補に基づいて計算） */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 mb-8 border-2 border-pink-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">予算合計</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 高めの合計 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">高めの場合</div>
                <div className="text-2xl font-bold text-pink-600">
                  {formatCurrency(
                    plan.venue.estimatedPrice.max +
                    plan.categoryAllocations.reduce((sum, alloc) => {
                      const selected = Array.from(selectedCandidates).find((key) => {
                        const parsed = parseCandidateKey(key)
                        if (!parsed) return false
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        return candidates.some((c) => c.vendorId === vendorId && c.profileId === profileId)
                      })
                      if (selected) {
                        // 選択された候補の価格（高めを想定）
                        const parsed = parseCandidateKey(selected)
                        if (!parsed) return sum + alloc.allocatedMax
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        const candidate = candidates.find((c) => c.vendorId === vendorId && c.profileId === profileId)
                        return sum + (candidate?.actualPrice ? candidate.actualPrice * 1.1 : alloc.allocatedMax)
                      }
                      return sum + alloc.allocatedMax
                    }, 0)
                  )}
                </div>
              </div>

              {/* バランスの合計 */}
              <div className="bg-white rounded-lg p-4 border-2 border-pink-400">
                <div className="text-sm text-gray-600 mb-1">バランス</div>
                <div className="text-2xl font-bold text-pink-700">
                  {formatCurrency(
                    plan.venue.estimatedPrice.mid +
                    plan.categoryAllocations.reduce((sum, alloc) => {
                      const selected = Array.from(selectedCandidates).find((key) => {
                        const parsed = parseCandidateKey(key)
                        if (!parsed) return false
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        return candidates.some((c) => c.vendorId === vendorId && c.profileId === profileId)
                      })
                      if (selected) {
                        // 選択された候補の価格
                        const parsed = parseCandidateKey(selected)
                        if (!parsed) return sum + alloc.allocatedMid
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        const candidate = candidates.find((c) => c.vendorId === vendorId && c.profileId === profileId)
                        return sum + (candidate?.actualPrice || alloc.allocatedMid)
                      }
                      return sum + alloc.allocatedMid
                    }, 0)
                  )}
                </div>
              </div>

              {/* 安めの合計 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">安めの場合</div>
                <div className="text-2xl font-bold text-pink-600">
                  {formatCurrency(
                    plan.venue.estimatedPrice.min +
                    plan.categoryAllocations.reduce((sum, alloc) => {
                      const selected = Array.from(selectedCandidates).find((key) => {
                        const parsed = parseCandidateKey(key)
                        if (!parsed) return false
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        return candidates.some((c) => c.vendorId === vendorId && c.profileId === profileId)
                      })
                      if (selected) {
                        // 選択された候補の価格（安めを想定）
                        const parsed = parseCandidateKey(selected)
                        if (!parsed) return sum + alloc.allocatedMin
                        const { vendorId, profileId } = parsed
                        const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
                        const candidate = candidates.find((c) => c.vendorId === vendorId && c.profileId === profileId)
                        return sum + (candidate?.actualPrice ? candidate.actualPrice * 0.9 : alloc.allocatedMin)
                      }
                      return sum + alloc.allocatedMin
                    }, 0)
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              ※ 選択された候補の価格を基に計算しています。未選択のカテゴリは予算配分の平均値を使用しています。
            </p>
          </div>

          {/* カテゴリごとの候補カルーセル（会場も含む） */}
          <div className="space-y-12">
            {/* まず会場を表示（categoryVendorCandidatesに含まれている場合） */}
            {(() => {
              const venueCategory = categories.find((c) => c.name === '会場')
              if (!venueCategory) return null
              const venueCandidates = plan.categoryVendorCandidates[venueCategory.id] || []
              if (venueCandidates.length === 0) return null

              return (
                <GenieCandidateCarousel
                  key={venueCategory.id}
                  categoryName="会場"
                  categoryId={venueCategory.id}
                  candidates={venueCandidates}
                  selectedCandidates={selectedCandidates}
                  onSelectChange={handleCandidateSelect}
                  formatCurrency={formatCurrency}
                />
              )
            })()}

            {/* その他のカテゴリ */}
            {plan.categoryAllocations.map((alloc) => {
              const candidates = plan.categoryVendorCandidates[alloc.categoryId] || []
              if (candidates.length === 0) return null

              return (
                <GenieCandidateCarousel
                  key={alloc.categoryId}
                  categoryName={alloc.categoryName}
                  categoryId={alloc.categoryId}
                  candidates={candidates}
                  selectedCandidates={selectedCandidates}
                  onSelectChange={handleCandidateSelect}
                  formatCurrency={formatCurrency}
                />
              )
            })}
          </div>

          {/* フッター */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                選択済み: {selectedCandidates.size}件
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={loading || savingPlan}
                  className="px-8 py-3 bg-white border-2 border-pink-600 text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {savingPlan ? '保存中...' : 'プランを保存'}
                </button>
                <button
                  onClick={handleRegisterSelected}
                  disabled={loading || selectedCandidates.size === 0}
                  className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading
                    ? '登録中...'
                    : selectedCandidates.size === 0
                    ? '候補を選択してください'
                    : `${selectedCandidates.size}件をPlanBoardに登録`}
                </button>
              </div>
            </div>
          </div>

          {/* プラン保存ダイアログ */}
          {showSaveDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">プランを保存</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プラン名（オプション）
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="例: 2025年春のプラン"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowSaveDialog(false)
                      setPlanName('')
                      setError('')
                    }}
                    disabled={savingPlan}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSavePlan}
                    disabled={savingPlan}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                  >
                    {savingPlan ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}
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
                {categories.filter((c) => c.name !== '会場').map((category) => (
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
                {categories.filter((c) => c.name !== '会場').map((category) => (
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
