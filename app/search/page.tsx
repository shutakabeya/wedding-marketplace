'use client'

import { useEffect, useState, Suspense } from 'react'
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

function SearchContent() {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
              ベンダー検索
            </span>
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            カテゴリやエリア、予算感で絞り込みながら、気になるベンダーを探せます。
          </p>
        </div>

        {/* フィルタ */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-6">検索条件</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                カテゴリ
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                placeholder="例: 会場"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                エリア
              </label>
              <input
                type="text"
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                placeholder="例: 東京都"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                最低価格
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                placeholder="¥"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                最高価格
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                placeholder="¥"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ソート
            </label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none w-full md:w-auto"
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
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-80 h-64 skeleton" />
                  <div className="flex-1 p-6">
                    <div className="h-6 w-3/4 skeleton mb-4 rounded" />
                    <div className="h-5 w-1/2 skeleton mb-3 rounded" />
                    <div className="h-4 w-full skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {vendors.map((vendor, index) => {
              const displayImage =
                vendor.profile?.profileImages?.[0] ||
                vendor.profile?.imageUrl ||
                vendor.gallery[0]?.imageUrl ||
                null

              return (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.id}`}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 border border-gray-100 group fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {displayImage ? (
                      <div className="relative w-full md:w-80 h-64 md:h-auto bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayImage}
                          alt={vendor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full md:w-80 h-64 md:h-auto bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex-shrink-0 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-400">写真を準備中</p>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-6">
                      {/* 左側：基本情報 */}
                      <div className="flex-1 flex flex-col gap-3 min-w-0">
                        <div className="flex items-start gap-4">
                          {vendor.logoUrl && (
                            <div className="relative w-14 h-14 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={vendor.logoUrl}
                                alt={`${vendor.name}ロゴ`}
                                className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                              {vendor.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {vendor.categories.map((c) => (
                                <span key={c.category.name} className="px-3 py-1 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 rounded-full text-xs font-medium border border-pink-200">
                                  {c.category.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {vendor.profile && (
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            {vendor.profile.priceMin && (
                              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                                ¥{vendor.profile.priceMin.toLocaleString()}〜
                              </span>
                            )}
                            {vendor.profile.areas && vendor.profile.areas.length > 0 && (
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {vendor.profile.areas.join(', ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* テイストタグ */}
                        {vendor.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {vendor.profile.styleTags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {vendor.profile.styleTags.length > 5 && (
                              <span className="px-3 py-1 text-gray-400 text-xs">
                                +{vendor.profile.styleTags.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 提供内容（抜粋） */}
                        {vendor.profile?.services && (
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {vendor.profile.services}
                          </p>
                        )}
                      </div>

                      {/* 右側：紹介文（PC版のみ） */}
                      {vendor.bio && (
                        <div className="md:w-80 md:flex-shrink-0 md:border-l md:border-gray-200 md:pl-6">
                          <p className="text-sm text-gray-600 line-clamp-4 md:line-clamp-none leading-relaxed">
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
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg text-gray-600 font-medium">
              該当するベンダーが見つかりませんでした
            </p>
            <p className="text-sm text-gray-500 mt-2">
              検索条件を変更してお試しください
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">読み込み中...</div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
