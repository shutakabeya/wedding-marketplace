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
    source?: string | null // "genie" | "manual"
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
  const [inquiries, setInquiries] = useState<any[]>([])
  const [step2Completed, setStep2Completed] = useState(false)
  const [todoExpanded, setTodoExpanded] = useState<{ [key: number]: boolean }>({ 1: true })

  useEffect(() => {
    loadPlanBoard()
    loadInquiries()
  }, [])

  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries?type=couple')
      if (res.status === 401) {
        router.push('/couple/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries || [])
      }
    } catch (error) {
      console.error('Failed to load inquiries:', error)
    }
  }

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
      // 決定を解除する場合、候補がある場合は'candidate'に戻す
      // genieから登録した候補がある場合は、最初のgenie候補をselectedVendorIdとして設定
      if (updates.state === 'unselected' && updates.selectedVendorId === null) {
        const slot = planBoard?.slots.find((s) => s.id === slotId)
        if (slot && slot.candidates.length > 0) {
          updates.state = 'candidate'
          // genieから登録した最初の候補があれば、それを選択状態にする
          const genieCandidate = slot.candidates.find((c) => c.source === 'genie')
          if (genieCandidate) {
            updates.selectedVendorId = genieCandidate.vendor.id
          } else {
            // genie候補がなければ、最初の候補を選択状態にする
            updates.selectedVendorId = slot.candidates[0].vendor.id
          }
        }
      }

      const res = await fetch(`/api/plan-board/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        throw new Error('更新に失敗しました')
      }

      await loadPlanBoard()
      // スロット更新後、問い合わせも再読み込み（ステップ2の進捗更新のため）
      await loadInquiries()
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

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

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

  const removeCandidate = async (slotId: string, vendorId: string) => {
    try {
      const res = await fetch(`/api/plan-board/slots/${slotId}/candidates?vendorId=${vendorId}`, {
        method: 'DELETE',
      })

      if (res.status === 401) {
        router.push('/couple/login')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '候補の削除に失敗しました')
        return
      }

      await loadPlanBoard()
    } catch (error) {
      console.error('Failed to remove candidate:', error)
      alert('候補の削除に失敗しました')
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

  // 次のアクションを提案（既存ロジックを再利用）
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

  // Todoステップの進捗判定
  type StepStatus = 'pending' | 'active' | 'completed'
  
  // ステップ1: 候補探し - 全てのスロットが 'selected' または 'skipped' になったら完了
  const isStep1Completed = () => {
    return planBoard.slots.every((s) => s.state === 'selected' || s.state === 'skipped')
  }

  // ステップ2: 問い合わせ - 決定済みスロットに対して問い合わせが作成されているか
  const hasSelectedSlots = selectedSlots.length > 0
  const hasInquiries = inquiries.length > 0
  // 決定済みスロットのベンダーIDのセット
  const selectedVendorIds = new Set(selectedSlots.map((s) => s.selectedVendorId).filter(Boolean))
  // 問い合わせがあるベンダーIDのセット
  const inquiredVendorIds = new Set(inquiries.map((inq) => inq.vendorId).filter(Boolean))
  // 問い合わせが必要なスロット数
  const slotsNeedingInquiry = selectedSlots.filter((s) => s.selectedVendorId && !inquiredVendorIds.has(s.selectedVendorId))

  const getStep1Status = (): StepStatus => {
    if (isStep1Completed()) return 'completed'
    // unselectedまたはcandidateがある場合はactive
    if (unselectedSlots.length > 0 || candidateSlots.length > 0) return 'active'
    return 'pending'
  }

  const getStep2Status = (): StepStatus => {
    if (!isStep1Completed()) return 'pending'
    // ユーザーが手動で完了を選択した場合
    if (step2Completed) return 'completed'
    // ステップ1完了後、決定済みスロットがある場合はactive
    if (hasSelectedSlots) return 'active'
    // 決定済みスロットがない場合はcompleted（スキップ済みのみの場合）
    return 'completed'
  }

  const getStep3Status = (): StepStatus => {
    // ステップ2が完了していない場合はpending
    const step2Status = getStep2Status()
    if (step2Status === 'pending') return 'pending'
    // ステップ2が完了したらactive（実際のタイムライン作成は今後実装）
    if (step2Status === 'completed') return 'active'
    return 'pending'
  }

  const getStep4Status = (): StepStatus => {
    // ステップ3が完了していない場合はpending
    const step3Status = getStep3Status()
    if (step3Status === 'pending') return 'pending'
    // ステップ3がactiveになったら、最終確認もactiveに
    if (step3Status === 'active') return 'active'
    return 'pending'
  }

  // ステップの色を取得
  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-500 text-green-900'
      case 'active':
        return 'bg-pink-50 border-pink-500 text-pink-900'
      case 'pending':
        return 'bg-gray-50 border-gray-300 text-gray-500'
    }
  }

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'active':
        return '→'
      case 'pending':
        return '○'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">結婚式プランボード</h1>

        {/* Todoリスト - 全体像を表示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">結婚式準備の進捗</h2>
          <div className="space-y-4">
            {/* ステップ1: 候補探し */}
            <div className={`rounded-lg border-2 p-4 ${getStepColor(getStep1Status())}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl font-bold mt-1">{getStepIcon(getStep1Status())}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold mb-2 text-lg">
                      ① 候補探し
                    </h3>
                  </div>
                  {todoExpanded[1] && getStep1Status() === 'active' && (
                    <div className="text-sm mb-2">
                      <p className="mb-2">各カテゴリでベンダーを探して候補を決めましょう</p>
                      {nextActions.length > 0 && (
                        <div className="bg-white rounded p-3 mt-2">
                          {nextActions.map((action, idx) => (
                            <div key={idx} className="mb-2 last:mb-0">
                              <p className="text-xs text-gray-700 mb-1">{action.message}</p>
                              <div className="flex flex-wrap gap-2">
                                {action.slots.slice(0, 5).map((slot) => (
                                  <Link
                                    key={slot.id}
                                    href={`/search?category=${encodeURIComponent(slot.category.name)}`}
                                    className="px-2 py-1 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 transition-colors"
                                  >
                                    {slot.category.name}を探す
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {todoExpanded[1] && getStep1Status() === 'completed' && (
                    <p className="text-sm">全てのカテゴリで候補を決定しました</p>
                  )}
                  {todoExpanded[1] && getStep1Status() === 'pending' && (
                    <p className="text-sm">候補探しを開始しましょう</p>
                  )}
                </div>
              </div>
            </div>

            {/* ステップ2: 問い合わせ */}
            {(getStep1Status() === 'completed' || todoExpanded[2]) && (
              <div className={`rounded-lg border-2 p-4 ${getStepColor(getStep2Status())}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl font-bold mt-1">{getStepIcon(getStep2Status())}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-2 text-lg">
                        ② 問い合わせ・注文
                      </h3>
                      {getStep1Status() === 'completed' && (
                        <button
                          onClick={() => setTodoExpanded({ ...todoExpanded, 2: !todoExpanded[2] })}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {todoExpanded[2] ? '閉じる' : '開く'}
                        </button>
                      )}
                    </div>
                    {todoExpanded[2] && getStep2Status() === 'active' && (
                      <div className="text-sm mb-2">
                        <p className="mb-3">決定したベンダーに問い合わせや注文を行いましょう</p>
                        {slotsNeedingInquiry.length > 0 && (
                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-xs font-medium mb-2 text-gray-700">問い合わせが必要なカテゴリ ({slotsNeedingInquiry.length}件):</p>
                            <div className="grid md:grid-cols-2 gap-2">
                              {slotsNeedingInquiry.map((slot) => (
                                <Link
                                  key={slot.id}
                                  href={`/vendors/${slot.selectedVendor?.id}${slot.selectedProfile?.id ? `?profileId=${slot.selectedProfile.id}` : ''}`}
                                  className="px-3 py-2 bg-pink-600 text-white rounded text-sm hover:bg-pink-700 transition-colors text-center"
                                >
                                  {slot.category.name}: {slot.selectedVendor?.name || '未設定'}に問い合わせる
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {hasInquiries && (
                          <div className="bg-white rounded p-3">
                            <p className="text-xs font-medium mb-2 text-gray-700">既に問い合わせ済みのカテゴリ:</p>
                            <div className="mb-2">
                              <Link
                                href="/couple/inquiries"
                                className="text-pink-600 hover:underline text-sm font-medium"
                              >
                                問い合わせ一覧を確認 → ({inquiries.length}件)
                              </Link>
                            </div>
                          </div>
                        )}
                        {getStep2Status() === 'active' && (
                          <div className="mt-3">
                            <button
                              onClick={() => setStep2Completed(true)}
                              className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                            >
                              完了済みにする
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {todoExpanded[2] && getStep2Status() === 'completed' && (
                      <p className="text-sm">問い合わせ・注文が完了しました</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ステップ3: タイムライン生成及び打ち合わせ */}
            {(getStep2Status() !== 'pending' || todoExpanded[3]) && (
              <div className={`rounded-lg border-2 p-4 ${getStepColor(getStep3Status())}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl font-bold mt-1">{getStepIcon(getStep3Status())}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-2 text-lg">
                        ③ タイムライン生成及び打ち合わせ
                      </h3>
                      {getStep2Status() !== 'pending' && (
                        <button
                          onClick={() => setTodoExpanded({ ...todoExpanded, 3: !todoExpanded[3] })}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {todoExpanded[3] ? '閉じる' : '開く'}
                        </button>
                      )}
                    </div>
                    {todoExpanded[3] && getStep3Status() === 'active' && (
                      <div className="text-sm mb-2">
                        <p className="mb-2">タイムライン作成ツールを使って、当日のスケジュールを組み立てましょう</p>
                        <div className="bg-white rounded p-3 mt-2">
                          <p className="text-xs text-gray-600 mb-2">
                            ※ タイムライン作成ツールは今後実装予定です
                          </p>
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white rounded text-sm cursor-not-allowed"
                          >
                            タイムライン作成ツール（準備中）
                          </button>
                        </div>
                      </div>
                    )}
                    {todoExpanded[3] && getStep3Status() === 'completed' && (
                      <p className="text-sm">タイムライン生成と打ち合わせが完了しました</p>
                    )}
                    {todoExpanded[3] && getStep3Status() === 'pending' && (
                      <p className="text-sm">前のステップが完了したら開始できます</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ステップ4: 最終確認 */}
            {(getStep3Status() !== 'pending' || todoExpanded[4]) && (
              <div className={`rounded-lg border-2 p-4 ${getStepColor(getStep4Status())}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl font-bold mt-1">{getStepIcon(getStep4Status())}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-2 text-lg">
                        ④ 最終確認
                      </h3>
                      {getStep3Status() !== 'pending' && (
                        <button
                          onClick={() => setTodoExpanded({ ...todoExpanded, 4: !todoExpanded[4] })}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {todoExpanded[4] ? '閉じる' : '開く'}
                        </button>
                      )}
                    </div>
                    {todoExpanded[4] && getStep4Status() === 'active' && (
                      <div className="text-sm mb-2">
                        <p className="mb-3">ここまでで決まったことを確認しましょう</p>
                        <div className="bg-white rounded p-4 mt-2">
                          <h4 className="font-medium mb-3 text-gray-900">決定内容サマリー</h4>
                          {selectedSlots.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-xs font-medium text-gray-700 mb-2">決定済みカテゴリ:</p>
                              <div className="grid md:grid-cols-2 gap-2">
                                {selectedSlots.map((slot) => (
                                  <div key={slot.id} className="border border-green-200 rounded p-2 bg-green-50">
                                    <div className="text-sm font-medium text-gray-900">{slot.category.name}</div>
                                    <div className="text-xs text-gray-600">
                                      {slot.selectedVendor?.name || '未設定'}
                                    </div>
                                    {slot.estimatedCost && (
                                      <div className="text-xs text-pink-600 mt-1">
                                        ¥{slot.estimatedCost.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {skippedSlots.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 mb-2">注文しないカテゴリ:</p>
                              <div className="flex flex-wrap gap-2">
                                {skippedSlots.map((slot) => (
                                  <span key={slot.id} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                    {slot.category.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {planBoard.weddingDate && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600">挙式日: {new Date(planBoard.weddingDate).toLocaleDateString('ja-JP')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {todoExpanded[4] && getStep4Status() === 'completed' && (
                      <p className="text-sm">最終確認が完了しました</p>
                    )}
                    {todoExpanded[4] && getStep4Status() === 'pending' && (
                      <p className="text-sm">前のステップが完了したら開始できます</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                    {slot.selectedVendor?.profile?.name || slot.selectedVendor?.name || '未設定'}
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
                  }).then((res) => {
                    if (res.status === 401) {
                      router.push('/couple/login')
                      return
                    }
                    loadPlanBoard()
                  })
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
                  }).then((res) => {
                    if (res.status === 401) {
                      router.push('/couple/login')
                      return
                    }
                    loadPlanBoard()
                  })
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
                  }).then((res) => {
                    if (res.status === 401) {
                      router.push('/couple/login')
                      return
                    }
                    loadPlanBoard()
                  })
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
                            <button
                              onClick={() => {
                                if (window.confirm('候補から削除しますか？')) {
                                  removeCandidate(slot.id, candidate.vendor.id)
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              削除
                            </button>
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
