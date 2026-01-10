import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

// 初期ブロック（たたき）を生成する関数
function createInitialTimelineItems() {
  return [
    {
      order: 0,
      startTime: null,
      duration: 60,
      isFixedTime: false,
      content: '新郎新婦支度',
      stakeholders: ['新郎新婦', 'スタッフ'],
      location: '',
      notes: '',
    },
    {
      order: 1,
      startTime: null,
      duration: 30,
      isFixedTime: false,
      content: '受付',
      stakeholders: ['ゲスト'],
      location: '',
      notes: '',
    },
    {
      order: 2,
      startTime: '12:00',
      duration: 30,
      isFixedTime: true,
      content: '挙式',
      stakeholders: ['新郎新婦', 'ゲスト', 'スタッフ'],
      location: '',
      notes: '',
    },
    {
      order: 3,
      startTime: null,
      duration: 60,
      isFixedTime: false,
      content: '写真撮影',
      stakeholders: ['新郎新婦', 'ゲスト', 'スタッフ'],
      location: '',
      notes: '',
    },
    {
      order: 4,
      startTime: null,
      duration: 120,
      isFixedTime: false,
      content: '食事・歓談',
      stakeholders: ['新郎新婦', 'ゲスト', 'スタッフ'],
      location: '',
      notes: '',
    },
    {
      order: 5,
      startTime: null,
      duration: 30,
      isFixedTime: false,
      content: '終了',
      stakeholders: ['新郎新婦', 'ゲスト', 'スタッフ'],
      location: '',
      notes: '',
    },
  ]
}

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

// GET: タイムライン取得または新規作成
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 }
      )
    }

    // 既存のタイムラインを取得（1つのカップルにつき1つのタイムラインのみ）
    let timeline = await prisma.timeline.findFirst({
      where: { coupleId: session.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // 存在しない場合は新規作成（初期ブロック付き）
    if (!timeline) {
      const initialItems = createInitialTimelineItems()
      const shareToken = crypto.randomBytes(32).toString('hex')

      timeline = await prisma.timeline.create({
        data: {
          coupleId: session.id,
          startTime: '09:00',
          shareToken,
          items: {
            create: initialItems,
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      })
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
    console.error('Timeline GET error:', error)
    return NextResponse.json(
      { error: 'タイムラインの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: タイムライン更新
const updateTimelineSchema = z.object({
  title: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  items: z.array(z.object({
    id: z.string().optional(), // 新規作成時はundefined
    order: z.number(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    duration: z.number().min(1),
    isFixedTime: z.boolean(),
    content: z.string().min(1),
    stakeholders: z.array(z.string()),
    location: z.string().nullable(),
    notes: z.string().nullable(),
  })).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.type !== 'couple') {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateTimelineSchema.parse(body)

    // 既存のタイムラインを取得
    let timeline = await prisma.timeline.findFirst({
      where: { coupleId: session.id },
    })

    if (!timeline) {
      // タイムラインが存在しない場合は新規作成
      const initialItems = createInitialTimelineItems()
      const shareToken = crypto.randomBytes(32).toString('hex')

      timeline = await prisma.timeline.create({
        data: {
          coupleId: session.id,
          startTime: data.startTime || '09:00',
          title: data.title || '結婚式当日のタイムライン',
          shareToken,
          items: {
            create: initialItems,
          },
        },
      })
    }

    // タイムラインの基本情報を更新
    const updateData: {
      title?: string
      startTime?: string
    } = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime
    }

    if (Object.keys(updateData).length > 0) {
      timeline = await prisma.timeline.update({
        where: { id: timeline.id },
        data: updateData,
      })
    }

    // アイテムを更新する場合
    if (data.items !== undefined) {
      // 既存のアイテムをすべて削除
      await prisma.timelineItem.deleteMany({
        where: { timelineId: timeline.id },
      })

      // 新しいアイテムを作成
      await prisma.timelineItem.createMany({
        data: data.items.map((item) => ({
          timelineId: timeline.id,
          order: item.order,
          startTime: item.startTime,
          duration: item.duration,
          isFixedTime: item.isFixedTime,
          content: item.content,
          stakeholders: item.stakeholders,
          location: item.location || null,
          notes: item.notes || null,
        })),
      })
    }

    // 更新後のタイムラインを取得
    const updatedTimeline = await prisma.timeline.findUnique({
      where: { id: timeline.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!updatedTimeline) {
      return NextResponse.json(
        { error: 'タイムラインが見つかりません' },
        { status: 404 }
      )
    }

    // 開始時刻を計算して返す
    const calculatedTimes = calculateTimelineTimes(
      updatedTimeline.items,
      updatedTimeline.startTime
    )

    const itemsWithTimes = updatedTimeline.items.map((item) => {
      const calculated = calculatedTimes.find((t) => t.order === item.order)
      return {
        ...item,
        calculatedStartTime: calculated?.startTime || null,
        calculatedEndTime: calculated?.endTime || null,
      }
    })

    return NextResponse.json({
      timeline: {
        ...updatedTimeline,
        items: itemsWithTimes,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Timeline PUT error:', error)
    return NextResponse.json(
      { error: 'タイムラインの更新に失敗しました' },
      { status: 500 }
    )
  }
}
