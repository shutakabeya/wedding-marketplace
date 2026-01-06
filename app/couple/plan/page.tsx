'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PlanBoardSlot {
  id: string
  category: { id: string; name: string }
  state: 'unselected' | 'candidate' | 'selected'
  selectedVendor: {
    id: string
    name: string
    profile: { priceMin: number; priceMax: number } | null
  } | null
  estimatedCost: number | null
  note: string | null
  candidates: Array<{
    vendor: {
      id: string
      name: string
      profile: { priceMin: number; priceMax: number } | null
    }
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

  const updateSlot = async (slotId: string, updates: Partial<PlanBoardSlot>) => {
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

  const getStateColor = (state: string) => {
    switch (state) {
      case 'selected':
        return 'bg-green-100 border-green-500'
      case 'candidate':
        return 'bg-yellow-100 border-yellow-500'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'selected':
        return '決定'
      case 'candidate':
        return '候補'
      default:
        return '未選択'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!planBoard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">PlanBoardの読み込みに失敗しました</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">結婚式プランボード</h1>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                挙式日
              </label>
              <input
                type="date"
                value={planBoard.weddingDate || ''}
                onChange={(e) => {
                  fetch('/api/plan-board', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weddingDate: e.target.value }),
                  }).then(() => loadPlanBoard())
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 50"
              />
            </div>
          </div>
        </div>

        {/* 予算合計 */}
        <div className="bg-pink-50 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">概算予算合計</h2>
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
                  <h3 className="text-lg font-semibold">{slot.category.name}</h3>
                  <span className="text-sm text-gray-600">
                    状態: {getStateLabel(slot.state)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSlot(slot.id, { state: 'candidate' })}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    候補
                  </button>
                  <button
                    onClick={() => updateSlot(slot.id, { state: 'unselected' })}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    未選択
                  </button>
                </div>
              </div>

              {slot.selectedVendor && (
                <div className="mb-4 p-3 bg-white rounded">
                  <div className="font-medium">{slot.selectedVendor.name}</div>
                  {slot.selectedVendor.profile && (
                    <div className="text-sm text-gray-600">
                      ¥{slot.selectedVendor.profile.priceMin?.toLocaleString()}〜
                      {slot.selectedVendor.profile.priceMax && (
                        <>¥{slot.selectedVendor.profile.priceMax.toLocaleString()}</>
                      )}
                    </div>
                  )}
                </div>
              )}

              {slot.candidates.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">候補ベンダー:</div>
                  <div className="space-y-2">
                    {slot.candidates.map((candidate) => (
                      <div key={candidate.vendor.id} className="p-2 bg-white rounded">
                        <div className="font-medium">{candidate.vendor.name}</div>
                        {candidate.vendor.profile && (
                          <div className="text-sm text-gray-600">
                            ¥{candidate.vendor.profile.priceMin?.toLocaleString()}〜
                            {candidate.vendor.profile.priceMax && (
                              <>¥{candidate.vendor.profile.priceMax.toLocaleString()}</>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() =>
                            updateSlot(slot.id, {
                              state: 'selected',
                              selectedVendorId: candidate.vendor.id,
                              estimatedCost: candidate.vendor.profile?.priceMin || null,
                            })
                          }
                          className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          決定
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="¥"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={slot.note || ''}
                  onChange={(e) => updateSlot(slot.id, { note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="メモを入力..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
