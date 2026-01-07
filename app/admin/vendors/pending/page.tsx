'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string
  email: string
  bio: string | null
  status: string
  createdAt: string
  categories: Array<{ category: { name: string } }>
  profile: {
    areas: string[]
    priceMin: number | null
    priceMax: number | null
  } | null
}

export default function AdminPendingVendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingVendors()
  }, [])

  const loadPendingVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors/pending')
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login')
        return
      }
      if (!res.ok) {
        throw new Error('データの取得に失敗しました')
      }
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Failed to load pending vendors:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (vendorId: string) => {
    if (!confirm('このベンダーを承認しますか？')) return

    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        throw new Error('承認に失敗しました')
      }

      alert('ベンダーを承認しました')
      await loadPendingVendors()
    } catch (error) {
      console.error('Failed to approve vendor:', error)
      alert('承認に失敗しました')
    }
  }

  const handleReject = async (vendorId: string) => {
    if (!confirm('このベンダーを否認しますか？')) return

    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/reject`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        throw new Error('否認に失敗しました')
      }

      alert('ベンダーを否認しました')
      await loadPendingVendors()
    } catch (error) {
      console.error('Failed to reject vendor:', error)
      alert('否認に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">承認待ちベンダー</h1>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ダッシュボード
          </Link>
        </div>

        {vendors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">承認待ちのベンダーはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{vendor.name}</h2>
                    <div className="text-sm text-gray-600 mb-2">メール: {vendor.email}</div>
                    {vendor.categories.length > 0 && (
                      <div className="text-sm text-gray-600 mb-2">
                        カテゴリ: {vendor.categories.map((c) => c.category.name).join(', ')}
                      </div>
                    )}
                    {vendor.profile && (
                      <div className="text-sm text-gray-600 mb-2">
                        対応エリア: {vendor.profile.areas.join(', ') || '未設定'}
                      </div>
                    )}
                    {vendor.profile && (vendor.profile.priceMin || vendor.profile.priceMax) && (
                      <div className="text-sm text-gray-600 mb-2">
                        価格目安:{' '}
                        {vendor.profile.priceMin && `¥${vendor.profile.priceMin.toLocaleString()}〜`}
                        {vendor.profile.priceMax && `¥${vendor.profile.priceMax.toLocaleString()}`}
                      </div>
                    )}
                    {vendor.bio && (
                      <p className="text-sm text-gray-700 mt-3 line-clamp-3">{vendor.bio}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      登録日: {new Date(vendor.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(vendor.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(vendor.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      否認
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
