'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface PlanBoardSlot {
  id: string
  category: { id: string; name: string }
  state: 'unselected' | 'candidate' | 'selected' | 'skipped'
  selectedVendorId?: string | null
  selectedVendor: {
    id: string
    name: string // 屋号
    profile: {
      id?: string
      name: string | null // 出品名（プラン名）
      priceMin: number | null
      priceMax: number | null
    } | null
  } | null
  selectedProfile?: {
    id: string
    name: string | null
  } | null
  estimatedCost: number | null
  note: string | null
  candidates: Array<{
    vendor: {
      id: string
      name: string // 屋号
      profile: {
        id?: string
        name: string | null // 出品名（プラン名）
        priceMin: number | null
        priceMax: number | null
      } | null
    }
    profileId?: string | null
  }>
}

interface PlanBoard {
  id: string
  weddingDate: string | null
  venueArea: string | null
  guestCount: number | null
  slots: PlanBoardSlot[]
}

export default function PlanBoardPage() {
  const router = useRouter()
  const [planBoard, setPlanBoard] = useState<PlanBoard | null>(null)
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlanBoard()
  }, [])

  const loadPlanBoard = async () => {
    try {
      const res = await fetch('/api/plan-board')
      if (res.status === 401) {
        router.push('/couple/login')
        return
      }
      const data = await res.json()
      setPlanBoard(data.planBoard)
      setTotalBudget(data.totalBudget || 0)
    } catch (error) {
      console.error('Failed to load plan board:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = async (
    slotId: string,
    updates: {
      state?: 'unselected' | 'candidate' | 'selected' | 'skipped'
      selectedVendorId?: string | null
      estimatedCost?: number | null
      note?: string | null
    }
  ) => {
    try {
      const res = await fetch(`/api/plan-board/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error('更新に失敗しました')
      }

      await loadPlanBoard()
    } catch (error) {
      console.error('Failed to update slot:', error)
      alert('更新に失敗しました')
    }
  }

  const addCandidate = async (slotId: string, vendorId: string) => {
    try {
      const res = await fetch(`/api/plan-board/slots/${slotId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '候補の追加に失敗しました')
        return
      }

      await loadPlanBoard()
    } catch (error) {
      console.error('Failed to add candidate:', error)
      alert('候補の追加に失敗しました')
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'selected':
        return 'bg-green-50 border-green-500'
      case 'candidate':
        return 'bg-yellow-50 border-yellow-500'
      case 'skipped':
        return 'bg-gray-100 border-gray-400'
      default:
        return 'bg-gray-50 border-gray-300'
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'selected':
        return '決定'
      case 'candidate':
        return '候補あり'
      case 'skipped':
        return '注文しない（決定）'
      default:
        return '未選択'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!planBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-red-600">PlanBoardの読み込みに失敗しました</div>
      </div>
    )
  }

  const selectedSlots = planBoard.slots.filter((s) => s.state === 'selected')
  const candidateSlots = planBoard.slots.filter((s) => s.state === 'candidate')
  const unselectedSlots = planBoard.slots.filter((s) => s.state === 'unselected')
  const skippedSlots = planBoard.slots.filter((s) => s.state === 'skipped')

  // 次のアクションを提案
  const getNextActions = () => {
    const actions = []
    if (unselectedSlots.length > 0) {
      actions.push({
        type: 'search',
        message: `${unselectedSlots.length}つのカテゴリでベンダーを探しましょう`,
        slots: unselectedSlots,
      })
    }
    if (candidateSlots.length > 0) {
      actions.push({
        type: 'decide',
        message: `${candidateSlots.length}つのカテゴリで候補から決定しましょう`,
        slots: candidateSlots,
      })
    }
    return actions
  }

  const nextActions = getNextActions()

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">結婚式プランボード</h1>

        {/* サマリーカード */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">決定済み</div>
            <div className="text-3xl font-bold text-green-600">{selectedSlots.length}</div>
            <div className="text-xs text-gray-500 mt-1">カテゴリ</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">候補あり</div>
            <div className="text-3xl font-bold text-yellow-600">{candidateSlots.length}</div>
            <div className="text-xs text-gray-500 mt-1">カテゴリ</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">未選択</div>
            <div className="text-3xl font-bold text-gray-600">{unselectedSlots.length}</div>
            <div className="text-xs text-gray-500 mt-1">カテゴリ</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">注文しない</div>
            <div className="text-3xl font-bold text-gray-500">{skippedSlots.length}</div>
            <div className="text-xs text-gray-500 mt-1">カテゴリ</div>
          </div>
        </div>

        {/* 決まっている業者 */}
        {selectedSlots.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">決まっている業者</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border-2 border-green-500 rounded-lg p-4 bg-green-50"
                >
                  <div className="text-sm text-gray-600 mb-1">{slot.category.name}</div>
                  <div className="font-semibold text-gray-900 mb-2">
                    {slot.selectedVendor?.name || '未設定'}
                  </div>
                  {slot.estimatedCost && (
                    <div className="text-sm font-medium text-pink-600">
                      ¥{slot.estimatedCost.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 次のアクション */}
        {nextActions.length > 0 && (
          <div className="bg-pink-50 rounded-lg shadow-md p-6 mb-6 border-2 border-pink-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">次のアクション</h2>
            <div className="space-y-3">
              {nextActions.map((action, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4">
                  <p className="text-gray-700 mb-3 font-medium">{action.message}</p>
                  <div className="flex flex-wrap gap-2">
                    {action.slots.slice(0, 5).map((slot) => (
                      <Link
                        key={slot.id}
                        href={`/search?category=${encodeURIComponent(slot.category.name)}`}
                        className="px-3 py-1 bg-pink-600 text-white rounded-md text-sm hover:bg-pink-700 transition-colors"
                      >
                        {slot.category.name}を探す
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">基本情報</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                挙式日
              </label>
              <input
                type="date"
                value={planBoard.weddingDate ? new Date(planBoard.weddingDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  fetch('/api/plan-board', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weddingDate: e.target.value }),
                  }).then(() => loadPlanBoard())
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会場エリア
              </label>
              <input
                type="text"
                value={planBoard.venueArea || ''}
                onChange={(e) => {
                  fetch('/api/plan-board', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venueArea: e.target.value }),
                  }).then(() => loadPlanBoard())
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
                placeholder="例: 東京都"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ゲスト数
              </label>
              <input
                type="number"
                value={planBoard.guestCount || ''}
                onChange={(e) => {
                  fetch('/api/plan-board', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guestCount: parseInt(e.target.value) || null }),
                  }).then(() => loadPlanBoard())
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
                placeholder="例: 50"
              />
            </div>
          </div>
        </div>

        {/* 予算合計 */}
        <div className="bg-pink-50 rounded-lg shadow-md p-6 mb-6 border-2 border-pink-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">概算予算合計</h2>
            <div className="text-3xl font-bold text-pink-600">
              ¥{totalBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* カテゴリスロット */}
        <div className="space-y-4">
          {planBoard.slots.map((slot) => (
            <div
              key={slot.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${getStateColor(slot.state)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{slot.category.name}</h3>
                  <span className="text-sm text-gray-600">
                    状態: {getStateLabel(slot.state)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {slot.state !== 'skipped' && (
                    <Link
                      href={`/search?category=${encodeURIComponent(slot.category.name)}`}
                      className="px-4 py-2 bg-pink-600 text-white rounded-md text-sm hover:bg-pink-700 transition-colors"
                    >
                      ベンダーを検索
                    </Link>
                  )}
                </div>
              </div>

              {slot.selectedVendor && (slot.state === 'selected' || (slot.state === 'candidate' && slot.selectedVendorId)) && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {slot.selectedVendor.profile?.name || slot.selectedVendor.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        屋号: {slot.selectedVendor.name}
                      </div>
                      {slot.selectedVendor.profile && (
                        <div className="text-sm text-gray-600">
                          {slot.selectedVendor.profile.priceMin && (
                            <>¥{slot.selectedVendor.profile.priceMin.toLocaleString()}〜</>
                          )}
                          {slot.selectedVendor.profile.priceMax && (
                            <>¥{slot.selectedVendor.profile.priceMax.toLocaleString()}</>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/vendors/${slot.selectedVendor.id}${slot.selectedProfile?.id ? `?profileId=${slot.selectedProfile.id}` : ''}`}
                        className="text-sm text-pink-600 hover:underline"
                      >
                        詳細を見る
                      </Link>
                      {slot.state === 'candidate' && slot.selectedVendorId && (
                        <button
                          onClick={() =>
                            updateSlot(slot.id, {
                              state: 'selected',
                              selectedVendorId: slot.selectedVendorId,
                            })
                          }
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          決定
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {slot.candidates.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2 text-gray-700">候補ベンダー:</div>
                  <div className="space-y-2">
                    {slot.candidates.map((candidate) => (
                      <div key={candidate.vendor.id} className="p-3 bg-white rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {candidate.vendor.profile?.name || candidate.vendor.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              屋号: {candidate.vendor.name}
                            </div>
                            {candidate.vendor.profile && (
                              <div className="text-sm text-gray-600">
                                {candidate.vendor.profile.priceMin && (
                                  <>¥{candidate.vendor.profile.priceMin.toLocaleString()}〜</>
                                )}
                                {candidate.vendor.profile.priceMax && (
                                  <>¥{candidate.vendor.profile.priceMax.toLocaleString()}</>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/vendors/${candidate.vendor.id}${candidate.profileId ? `?profileId=${candidate.profileId}` : ''}`}
                              className="text-sm text-pink-600 hover:underline"
                            >
                              詳細
                            </Link>
                            {slot.state === 'candidate' && (
                              <>
                                {slot.selectedVendorId === candidate.vendor.id ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateSlot(slot.id, {
                                          state: 'selected',
                                          selectedVendorId: candidate.vendor.id,
                                          estimatedCost: candidate.vendor.profile?.priceMin || null,
                                        })
                                      }
                                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                                    >
                                      決定
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateSlot(slot.id, {
                                          state: 'candidate',
                                          selectedVendorId: null,
                                        })
                                      }
                                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                                    >
                                      解除
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() =>
                                      updateSlot(slot.id, {
                                        state: 'candidate',
                                        selectedVendorId: candidate.vendor.id,
                                        estimatedCost: candidate.vendor.profile?.priceMin || null,
                                      })
                                    }
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                  >
                                    選択
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex flex-wrap gap-2 mb-4">
                {slot.state !== 'skipped' && slot.state !== 'selected' && (
                  <button
                    onClick={() =>
                      updateSlot(slot.id, {
                        state: 'skipped',
                        selectedVendorId: null,
                      })
                    }
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors font-medium"
                  >
                    注文しない（決定）
                  </button>
                )}
                {slot.state === 'skipped' && (
                  <button
                    onClick={() =>
                      updateSlot(slot.id, {
                        state: 'unselected',
                        selectedVendorId: null,
                      })
                    }
                    className="px-4 py-2 bg-pink-600 text-white rounded-md text-sm hover:bg-pink-700 transition-colors"
                  >
                    決定を解除
                  </button>
                )}
                {slot.state === 'selected' && slot.selectedVendor && (
                  <button
                    onClick={() =>
                      updateSlot(slot.id, {
                        state: 'unselected',
                        selectedVendorId: null,
                      })
                    }
                    className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                  >
                    決定を解除
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    概算予算
                  </label>
                  <input
                    type="number"
                    value={slot.estimatedCost || ''}
                    onChange={(e) =>
                      updateSlot(slot.id, {
                        estimatedCost: parseInt(e.target.value) || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    placeholder="¥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メモ
                  </label>
                  <textarea
                    value={slot.note || ''}
                    onChange={(e) => updateSlot(slot.id, { note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    rows={3}
                    placeholder="メモを入力..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
