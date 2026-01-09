'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'

interface SavedPlan {
  id: string
  planName: string | null
  inputSnapshot: any
  planData: any
  createdAt: string
  updatedAt: string
}

export default function SavedPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/wedding-genie/plans')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '取得に失敗しました')
        return
      }

      setPlans(data.plans || [])
    } catch (err) {
      setError('取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('このプランを削除しますか？')) return

    try {
      const res = await fetch(`/api/wedding-genie/plans/${planId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '削除に失敗しました')
        return
      }

      // 一覧を再取得
      fetchPlans()
    } catch (err) {
      alert('削除に失敗しました')
    }
  }

  const handleRegisterToPlanBoard = async (planId: string) => {
    try {
      const res = await fetch(`/api/wedding-genie/plans/${planId}/register`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'PlanBoard登録に失敗しました')
        return
      }

      alert('PlanBoardに登録しました')
      router.push('/couple/plan')
    } catch (err) {
      alert('PlanBoard登録に失敗しました')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/wedding-genie"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            ← Wedding Genieに戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">保存したプラン</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
            保存したプランはありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const planData = plan.planData
              const planLabels: Record<string, { name: string; desc: string }> = {
                balanced: { name: 'プランA', desc: 'バランス型' },
                priority: { name: 'プランB', desc: '重視反映型' },
                budget: { name: 'プランC', desc: '節約型' },
              }
              const label = planLabels[planData.planType as string] || { name: 'プラン', desc: '' }

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-lg shadow-lg p-6 border-2 border-pink-100"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {plan.planName || label.name}
                    </h2>
                    <p className="text-sm text-gray-600">{label.desc}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(plan.createdAt)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">入力条件</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>エリア: {plan.inputSnapshot.area}</div>
                      <div>人数: {plan.inputSnapshot.guestCount}人</div>
                      <div>予算: {formatCurrency(plan.inputSnapshot.totalBudget)}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">予算合計</h3>
                    <div className="text-sm text-gray-600">
                      <div>下限: {formatCurrency(planData.totals.totalMin)}</div>
                      <div>中央: {formatCurrency(planData.totals.totalMid)}</div>
                      <div>上限: {formatCurrency(planData.totals.totalMax)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleRegisterToPlanBoard(plan.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-all"
                    >
                      PlanBoardに登録
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
