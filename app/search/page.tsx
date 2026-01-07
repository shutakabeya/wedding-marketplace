'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    imageUrl: string | null
    priceMin: number | null
    priceMax: number | null
    areas: string[]
  } | null
  gallery: Array<{ imageUrl: string }>
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: category || '',
    area: '',
    priceMin: '',
    priceMax: '',
    sort: 'recommended',
  })

  useEffect(() => {
    searchVendors()
  }, [filters])

  const searchVendors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.area) params.append('area', filters.area)
      if (filters.priceMin) params.append('price_min', filters.priceMin)
      if (filters.priceMax) params.append('price_max', filters.priceMax)
      params.append('sort', filters.sort)

      const res = await fetch(`/api/vendors?${params}`)
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">ベンダー検索</h1>
        <p className="text-sm text-gray-600 mb-6">
          カテゴリやエリア、予算感で絞り込みながら、気になるベンダーを探せます。
        </p>

        {/* フィルタ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="例: 会場"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                エリア
              </label>
              <input
                type="text"
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="例: 東京都"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最低価格
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="¥"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最高価格
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="¥"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ソート
            </label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="recommended">おすすめ</option>
              <option value="name">名前順</option>
              <option value="price_asc">価格: 安い順</option>
              <option value="price_desc">価格: 高い順</option>
            </select>
          </div>
        </div>

        {/* 検索結果 */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">読み込み中...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                {/* プロフィール画像またはギャラリー画像を表示 */}
                {(vendor.profile?.imageUrl || vendor.gallery.length > 0) && (
                  <div className="relative w-full h-48 bg-gray-200">
                    <img
                      src={vendor.profile?.imageUrl || vendor.gallery[0].imageUrl}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 画像読み込みエラー時はプレースホルダーを表示
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {vendor.logoUrl && (
                      <img
                        src={vendor.logoUrl}
                        alt={`${vendor.name}ロゴ`}
                        className="w-12 h-12 object-cover rounded-full border border-gray-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {vendor.categories.map((c) => c.category.name).join(', ')}
                  </div>
                  {vendor.profile && (
                    <div className="text-sm font-medium text-pink-600">
                      {vendor.profile.priceMin && (
                        <>¥{vendor.profile.priceMin.toLocaleString()}〜</>
                      )}
                      {vendor.profile.priceMax && (
                        <>¥{vendor.profile.priceMax.toLocaleString()}</>
                      )}
                    </div>
                  )}
                  {vendor.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {vendor.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && vendors.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            該当するベンダーが見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
}
