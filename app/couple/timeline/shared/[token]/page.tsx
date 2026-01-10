'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface TimelineItem {
  id: string
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
  items: TimelineItem[]
}

type Viewpoint = 'couple' | 'guest' | 'staff'

export default function SharedTimelinePage() {
  const params = useParams()
  const token = params.token as string
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewpoint, setViewpoint] = useState<Viewpoint>('couple')

  useEffect(() => {
    loadTimeline()
  }, [token])

  const loadTimeline = async () => {
    try {
      const response = await fetch(`/api/timeline/shared/${token}`)
      if (!response.ok) {
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
      item.stakeholders.length === 0
    )
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {timeline.title}
              </h1>
              <p className="text-gray-600">共有タイムライン（閲覧専用）</p>
            </div>
            <button
              onClick={printTimeline}
              className="px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-semibold transition-all"
            >
              印刷
            </button>
          </div>

          <div className="mb-4">
            <span className="text-gray-700 font-medium">開始時刻: </span>
            <span className="text-pink-600 font-semibold">{timeline.startTime}</span>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {getViewpointLabel(viewpoint)}で表示中
          </h2>

          {displayedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              この視点で表示できる項目がありません
            </div>
          ) : (
            <div className="space-y-4">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.content}
                      </h3>

                      {/* 関係者タグ */}
                      {item.stakeholders.length > 0 && (
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
                      )}

                      {/* 場所 */}
                      {item.location && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">場所: </span>
                          {item.location}
                        </div>
                      )}

                      {/* メモ */}
                      {item.notes && (
                        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
