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
    profileImages: string[]
    priceMin: number | null
    priceMax: number | null
    areas: string[]
    styleTags: string[]
    services: string | null
    constraints: string | null
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
          <div className="space-y-4">
            {vendors.map((vendor) => {
              const displayImage =
                vendor.profile?.profileImages?.[0] ||
                vendor.profile?.imageUrl ||
                vendor.gallery[0]?.imageUrl ||
                null

              return (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  <div className="flex flex-col md:flex-row">
                    {displayImage && (
                      <div className="relative w-full md:w-64 h-48 md:h-40 bg-gray-200 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayImage}
                          alt={vendor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
                      {/* 左側：基本情報 */}
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-start gap-3">
                          {vendor.logoUrl && (
                            <img
                              src={vendor.logoUrl}
                              alt={`${vendor.name}ロゴ`}
                              className="w-10 h-10 object-cover rounded-full border border-gray-300 flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">
                              {vendor.name}
                            </h3>
                            <div className="text-xs md:text-sm text-gray-600">
                              {vendor.categories.map((c) => c.category.name).join(', ')}
                            </div>
                          </div>
                        </div>

                        {vendor.profile && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-700">
                            {vendor.profile.priceMin && (
                              <span className="font-medium text-pink-600">
                                ¥{vendor.profile.priceMin.toLocaleString()}〜
                              </span>
                            )}
                            {vendor.profile.areas && vendor.profile.areas.length > 0 && (
                              <span className="text-gray-500">
                                エリア: {vendor.profile.areas.join(', ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* テイストタグ */}
                        {vendor.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] md:text-xs text-gray-700 mt-1">
                            {vendor.profile.styleTags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-100"
                              >
                                {tag}
                              </span>
                            ))}
                            {vendor.profile.styleTags.length > 5 && (
                              <span className="text-gray-400">
                                +{vendor.profile.styleTags.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 提供内容（抜粋） */}
                        {vendor.profile?.services && (
                          <p className="text-[11px] md:text-xs text-gray-600 line-clamp-2">
                            {vendor.profile.services}
                          </p>
                        )}
                      </div>

                      {/* 右側：紹介文（PC版のみ） */}
                      {vendor.bio && (
                        <div className="md:w-64 md:flex-shrink-0 md:border-l md:border-gray-200 md:pl-4">
                          <p className="text-xs md:text-sm text-gray-600 line-clamp-3 md:line-clamp-none">
                            {vendor.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
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
