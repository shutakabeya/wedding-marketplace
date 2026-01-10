'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface TimelineItem {
  id?: string
  order: number
  startTime: string | null
  duration: number
  isFixedTime: boolean
  content: string
  stakeholders: string[]
  location: string | null
  notes: string | null
  calculatedStartTime?: string | null
  calculatedEndTime?: string | null
}

interface Timeline {
  id: string
  title: string
  startTime: string
  shareToken: string
  items: TimelineItem[]
}

type Viewpoint = 'couple' | 'guest' | 'staff'

const STAKEHOLDER_OPTIONS = ['新郎新婦', 'ゲスト', 'スタッフ', 'ベンダー']

export default function TimelinePage() {
  const router = useRouter()
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewpoint, setViewpoint] = useState<Viewpoint>('couple')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTimeline()
  }, [])

  const loadTimeline = async () => {
    try {
      const response = await fetch('/api/timeline')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/couple/login')
          return
        }
        throw new Error('タイムラインの取得に失敗しました')
      }
      const data = await response.json()
      setTimeline(data.timeline)
    } catch (error) {
      console.error('Failed to load timeline:', error)
      alert('タイムラインの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const saveTimeline = async () => {
    if (!timeline) return

    setSaving(true)
    try {
      const response = await fetch('/api/timeline', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: timeline.title,
          startTime: timeline.startTime,
          items: timeline.items.map((item) => ({
            id: item.id,
            order: item.order,
            startTime: item.startTime,
            duration: item.duration,
            isFixedTime: item.isFixedTime,
            content: item.content,
            stakeholders: item.stakeholders,
            location: item.location,
            notes: item.notes,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('タイムラインの保存に失敗しました')
      }

      const data = await response.json()
      setTimeline(data.timeline)
      alert('タイムラインを保存しました')
    } catch (error) {
      console.error('Failed to save timeline:', error)
      alert('タイムラインの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    if (!timeline) return

    const newOrder = timeline.items.length > 0
      ? Math.max(...timeline.items.map((i) => i.order)) + 1
      : 0

    const newItem: TimelineItem = {
      order: newOrder,
      startTime: null,
      duration: 30,
      isFixedTime: false,
      content: '',
      stakeholders: [],
      location: '',
      notes: '',
    }

    const newItems = [...timeline.items, newItem]

    // 時刻を再計算
    const calculatedTimes = calculateTimelineTimes(newItems, timeline.startTime)
    const itemsWithTimes = newItems.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    setTimeline({
      ...timeline,
      items: itemsWithTimes,
    })
    setEditingItemId('new-' + newOrder)
  }

  const deleteItem = (order: number) => {
    if (!timeline) return
    if (!confirm('この項目を削除しますか？')) return

    const newItems = timeline.items
      .filter((item) => item.order !== order)
      .map((item, index) => ({
        ...item,
        order: index,
      }))

    // 時刻を再計算
    const calculatedTimes = calculateTimelineTimes(newItems, timeline.startTime)
    const itemsWithTimes = newItems.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    setTimeline({
      ...timeline,
      items: itemsWithTimes,
    })
  }

  const moveItem = (order: number, direction: 'up' | 'down') => {
    if (!timeline) return

    const index = timeline.items.findIndex((item) => item.order === order)
    if (index === -1) return

    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === timeline.items.length - 1) return

    const newItems = [...timeline.items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // orderを入れ替え
    const tempOrder = newItems[index].order
    newItems[index].order = newItems[targetIndex].order
    newItems[targetIndex].order = tempOrder

    // orderでソート
    newItems.sort((a, b) => a.order - b.order)

    // 時刻を再計算
    const calculatedTimes = calculateTimelineTimes(newItems, timeline.startTime)
    const itemsWithTimes = newItems.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    setTimeline({
      ...timeline,
      items: itemsWithTimes,
    })
  }

  // 時間を分に変換する関数
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // 分を時間に変換する関数
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  // タイムラインの開始時刻から各項目の開始時刻を計算する関数
  const calculateTimelineTimes = (items: TimelineItem[], startTime: string) => {
    const sortedItems = [...items].sort((a, b) => a.order - b.order)
    let currentTime = timeToMinutes(startTime)
    const calculatedItems: Array<{ order: number; startTime: string; endTime: string }> = []

    for (const item of sortedItems) {
      let itemStartTime: number
      
      if (item.isFixedTime && item.startTime) {
        // 固定時刻の場合はその時刻を使用
        itemStartTime = timeToMinutes(item.startTime)
        // 次の項目の開始時刻は固定時刻の終了時刻から続く
        currentTime = itemStartTime + item.duration
      } else {
        // 固定時刻でない場合は現在の時刻を使用
        itemStartTime = currentTime
        // 次の項目の開始時刻を更新
        currentTime += item.duration
      }

      const startTimeStr = minutesToTime(itemStartTime)
      const endTimeStr = minutesToTime(itemStartTime + item.duration)

      calculatedItems.push({
        order: item.order,
        startTime: startTimeStr,
        endTime: endTimeStr,
      })
    }

    return calculatedItems.sort((a, b) => a.order - b.order)
  }

  const updateItem = (order: number, updates: Partial<TimelineItem>) => {
    if (!timeline) return

    const newItems = timeline.items.map((item) =>
      item.order === order ? { ...item, ...updates } : item
    )

    // 時刻を再計算
    const calculatedTimes = calculateTimelineTimes(newItems, timeline.startTime)
    const itemsWithTimes = newItems.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    setTimeline({
      ...timeline,
      items: itemsWithTimes,
    })
  }

  const toggleStakeholder = (order: number, stakeholder: string) => {
    if (!timeline) return

    const item = timeline.items.find((i) => i.order === order)
    if (!item) return

    const newStakeholders = item.stakeholders.includes(stakeholder)
      ? item.stakeholders.filter((s) => s !== stakeholder)
      : [...item.stakeholders, stakeholder]

    updateItem(order, { stakeholders: newStakeholders })
  }

  // 視点に基づいてフィルタリング
  const filterItemsByViewpoint = (items: TimelineItem[]): TimelineItem[] => {
    const viewpointMap: Record<Viewpoint, string[]> = {
      couple: ['新郎新婦'],
      guest: ['ゲスト'],
      staff: ['スタッフ', 'ベンダー'],
    }

    const targetStakeholders = viewpointMap[viewpoint]
    return items.filter((item) =>
      item.stakeholders.some((s) => targetStakeholders.includes(s)) ||
      item.stakeholders.length === 0 // 関係者が未設定の場合は全表示
    )
  }

  const getViewpointLabel = (vp: Viewpoint): string => {
    switch (vp) {
      case 'couple':
        return '新郎新婦視点'
      case 'guest':
        return 'ゲスト視点'
      case 'staff':
        return 'スタッフ視点'
    }
  }

  const getShareUrl = () => {
    if (!timeline) return ''
    return `${window.location.origin}/couple/timeline/shared/${timeline.shareToken}`
  }

  const copyShareUrl = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      alert('共有URLをコピーしました')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      alert('URLのコピーに失敗しました')
    }
  }

  const printTimeline = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!timeline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center">
        <div className="text-gray-600">タイムラインが見つかりません</div>
      </div>
    )
  }

  const displayedItems = filterItemsByViewpoint(timeline.items)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/couple/plan"
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all flex items-center gap-2"
              >
                ← PlanBoardに戻る
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">タイムライン作成</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveTimeline}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={copyShareUrl}
                className="px-4 py-2 bg-white border-2 border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 font-semibold transition-all"
              >
                共有
              </button>
              <button
                onClick={printTimeline}
                className="px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-semibold transition-all"
              >
                印刷
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">タイトル:</span>
              <input
                type="text"
                value={timeline.title}
                onChange={(e) =>
                  setTimeline({ ...timeline, title: e.target.value })
                }
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">開始時刻:</span>
              <input
                type="time"
                value={timeline.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value
                  // 時刻を再計算
                  const calculatedTimes = calculateTimelineTimes(timeline.items, newStartTime)
                  const itemsWithTimes = timeline.items.map((item) => {
                    const calculated = calculatedTimes.find((t) => t.order === item.order)
                    return {
                      ...item,
                      calculatedStartTime: calculated?.startTime || null,
                      calculatedEndTime: calculated?.endTime || null,
                    }
                  })
                  setTimeline({
                    ...timeline,
                    startTime: newStartTime,
                    items: itemsWithTimes,
                  })
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </label>
          </div>

          {/* 視点切り替え */}
          <div className="flex gap-2">
            {(['couple', 'guest', 'staff'] as Viewpoint[]).map((vp) => (
              <button
                key={vp}
                onClick={() => setViewpoint(vp)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewpoint === vp
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-pink-400'
                }`}
              >
                {getViewpointLabel(vp)}
              </button>
            ))}
          </div>
        </div>

        {/* タイムラインリスト */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {getViewpointLabel(viewpoint)}で表示中
            </h2>
            <button
              onClick={addItem}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + 項目を追加
            </button>
          </div>

          {displayedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              この視点で表示できる項目がありません
            </div>
          ) : (
            <div className="space-y-4">
              {displayedItems.map((item, index) => (
                <TimelineItemCard
                  key={item.id || `item-${item.order}`}
                  item={item}
                  isExpanded={expandedItems.has(item.id || `item-${item.order}`)}
                  onToggleExpand={() => {
                    const newExpanded = new Set(expandedItems)
                    const key = item.id || `item-${item.order}`
                    if (newExpanded.has(key)) {
                      newExpanded.delete(key)
                    } else {
                      newExpanded.add(key)
                    }
                    setExpandedItems(newExpanded)
                  }}
                  onUpdate={(updates) => updateItem(item.order, updates)}
                  onDelete={() => deleteItem(item.order)}
                  onMoveUp={() => moveItem(item.order, 'up')}
                  onMoveDown={() => moveItem(item.order, 'down')}
                  onToggleStakeholder={(stakeholder) =>
                    toggleStakeholder(item.order, stakeholder)
                  }
                  canMoveUp={index > 0}
                  canMoveDown={index < displayedItems.length - 1}
                  stakeholderOptions={STAKEHOLDER_OPTIONS}
                />
              ))}
            </div>
          )}
        </div>

        {/* ヒント */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">💡 ヒント</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• 所要時間を変更すると、後続の項目の時刻が自動で調整されます</li>
            <li>• 「開始時刻を固定」にチェックを入れると、その時刻から必ず開始されます</li>
            <li>• 視点を切り替えることで、各関係者の視点で当日の流れを確認できます</li>
            <li>• 写真撮影の場合、移動時間も考慮すると良いでしょう</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

interface TimelineItemCardProps {
  item: TimelineItem
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<TimelineItem>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleStakeholder: (stakeholder: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
  stakeholderOptions: string[]
}

function TimelineItemCard({
  item,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleStakeholder,
  canMoveUp,
  canMoveDown,
  stakeholderOptions,
}: TimelineItemCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors">
      <div className="flex items-start gap-4">
        {/* 時刻表示 */}
        <div className="min-w-[100px] text-center">
          <div className="text-lg font-bold text-pink-600">
            {item.calculatedStartTime || '--:--'}
          </div>
          <div className="text-sm text-gray-500">
            {item.duration}分
          </div>
          {item.calculatedEndTime && (
            <div className="text-xs text-gray-400 mt-1">
              ~{item.calculatedEndTime}
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="内容（例: 受付開始）"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-semibold"
            />
            <button
              onClick={onToggleExpand}
              className="px-3 py-2 text-gray-600 hover:text-pink-600 transition-colors"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>

          {/* 関係者タグ */}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.stakeholders.map((stakeholder) => (
              <span
                key={stakeholder}
                className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
              >
                {stakeholder}
              </span>
            ))}
          </div>

          {/* 展開時の詳細 */}
          {isExpanded && (
            <div className="mt-4 space-y-3 border-t pt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所要時間（分）
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.duration}
                  onChange={(e) =>
                    onUpdate({ duration: parseInt(e.target.value) || 30 })
                  }
                  className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.isFixedTime}
                  onChange={(e) => onUpdate({ isFixedTime: e.target.checked })}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <label className="text-sm text-gray-700">開始時刻を固定</label>
              </div>

              {item.isFixedTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    固定開始時刻
                  </label>
                  <input
                    type="time"
                    value={item.startTime || ''}
                    onChange={(e) => onUpdate({ startTime: e.target.value || null })}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  関係者
                </label>
                <div className="flex flex-wrap gap-2">
                  {stakeholderOptions.map((stakeholder) => (
                    <button
                      key={stakeholder}
                      onClick={() => onToggleStakeholder(stakeholder)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        item.stakeholders.includes(stakeholder)
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {stakeholder}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所
                </label>
                <input
                  type="text"
                  value={item.location || ''}
                  onChange={(e) => onUpdate({ location: e.target.value || null })}
                  placeholder="例: 式場、受付エリア"
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={item.notes || ''}
                  onChange={(e) => onUpdate({ notes: e.target.value || null })}
                  placeholder="注意点・確認事項など"
                  rows={3}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="px-2 py-1 text-gray-600 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="上に移動"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="px-2 py-1 text-gray-600 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="下に移動"
          >
            ↓
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors"
            title="削除"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
