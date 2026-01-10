import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 時間を分に変換する関数
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 分を時間に変換する関数
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// タイムラインの開始時刻から各項目の開始時刻を計算する関数
function calculateTimelineTimes(items: Array<{
  order: number
  startTime: string | null
  duration: number
  isFixedTime: boolean
}>, timelineStartTime: string) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order)
  let currentTime = timeToMinutes(timelineStartTime)
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

    const startTime = minutesToTime(itemStartTime)
    const endTime = minutesToTime(itemStartTime + item.duration)

    calculatedItems.push({
      order: item.order,
      startTime,
      endTime,
    })
  }

  return calculatedItems.sort((a, b) => a.order - b.order)
}

// GET: 共有タイムライン取得（認証不要）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const timeline = await prisma.timeline.findUnique({
      where: { shareToken: token },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!timeline) {
      return NextResponse.json(
        { error: 'タイムラインが見つかりません' },
        { status: 404 }
      )
    }

    // 開始時刻を計算して返す
    const calculatedTimes = calculateTimelineTimes(
      timeline.items,
      timeline.startTime
    )

    const itemsWithTimes = timeline.items.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    return NextResponse.json({
      timeline: {
        ...timeline,
        items: itemsWithTimes,
      },
    })
  } catch (error) {
    console.error('Shared timeline GET error:', error)
    return NextResponse.json(
      { error: 'タイムラインの取得に失敗しました' },
      { status: 500 }
    )
  }
}
