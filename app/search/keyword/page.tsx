'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    id: string
    name: string | null
    imageUrl: string | null
    profileImages: string[]
    priceMin: number | null
    priceMax: number | null
    areas: string[]
    styleTags: string[]
    services: string | null
    constraints: string | null
  } | null
  profileId?: string
  gallery: Array<{ imageUrl: string }>
}

interface SearchResultCardProps {
  vendor: Vendor
  allProfileImages: string[]
  index: number
}

function SearchResultCard({ vendor, allProfileImages, index }: SearchResultCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [vendor.id, vendor.profileId])

  const hasImages = allProfileImages.length > 0

  return (
    <Link
      href={`/vendors/${vendor.id}${vendor.profileId ? `?profileId=${vendor.profileId}` : ''}`}
      className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 border border-gray-100 group fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col md:flex-row">
        {hasImages ? (
          <div className="relative w-full md:w-80 h-64 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex-shrink-0 overflow-hidden">
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={allProfileImages[currentImageIndex]}
                src={allProfileImages[currentImageIndex]}
                alt={`${vendor.name}の写真 ${currentImageIndex + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            {allProfileImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev - 1 + allProfileImages.length) % allProfileImages.length)
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10 opacity-0 group-hover:opacity-100"
                  aria-label="前の画像"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev + 1) % allProfileImages.length)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10 opacity-0 group-hover:opacity-100"
                  aria-label="次の画像"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full md:w-80 h-64 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-400">写真を準備中</p>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">
                {vendor.profile?.name || vendor.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">屋号: {vendor.name}</p>
              {vendor.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {vendor.categories.slice(0, 3).map((vc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                    >
                      {vc.category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {vendor.profile && (
            <div className="flex-1 space-y-3">
              {vendor.profile.priceMin && (
                <div className="text-lg font-semibold text-gray-900">
                  {vendor.profile.priceMin && <>¥{vendor.profile.priceMin.toLocaleString()}〜</>}
                  {vendor.profile.priceMax && <>¥{vendor.profile.priceMax.toLocaleString()}</>}
                </div>
              )}

              {vendor.profile.areas.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">エリア:</span>{' '}
                    {vendor.profile.areas.slice(0, 3).join('、')}
                    {vendor.profile.areas.length > 3 && ' 他'}
                  </p>
                </div>
              )}

              {vendor.profile.styleTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {vendor.profile.styleTags.slice(0, 5).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {vendor.profile.services && (
                <p className="text-sm text-gray-700 line-clamp-2">{vendor.profile.services}</p>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-pink-600 group-hover:text-pink-700">
              詳細を見る →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function KeywordSearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(query)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      loadVendors(query, 1)
    } else {
      setLoading(false)
    }
  }, [query])

  const loadVendors = async (q: string, p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search/keyword?q=${encodeURIComponent(q)}&page=${p}&limit=20`)
      if (!res.ok) throw new Error('検索に失敗しました')
      const data = await res.json()
      setVendors(data.vendors || [])
      setTotal(data.total || 0)
      setPage(p)
    } catch (error) {
      console.error('Failed to load vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search/keyword?q=${encodeURIComponent(searchQuery.trim())}`)
      loadVendors(searchQuery.trim(), 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">キーワード検索</h1>
          
          {/* 検索バー */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="例: 東京都のカジュアルな会場、エレガントな写真、オーガニックなケーキ"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-base"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                検索
              </button>
            </div>
          </form>

          {query && (
            <p className="text-gray-600">
              「{query}」の検索結果: <span className="font-semibold">{total}件</span>
            </p>
          )}
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
        ) : vendors.length > 0 ? (
          <div className="space-y-6">
            {vendors.map((vendor, index) => {
              const allProfileImages: string[] = [
                ...(vendor.profile?.profileImages || []),
                ...(vendor.profile?.imageUrl ? [vendor.profile.imageUrl] : []),
                ...(vendor.gallery?.map((g: any) => g.imageUrl) || []),
              ].filter((url, idx, self) => url && self.indexOf(url) === idx)

              return (
                <SearchResultCard
                  key={`${vendor.id}-${vendor.profileId || 'default'}`}
                  vendor={vendor}
                  allProfileImages={allProfileImages}
                  index={index}
                />
              )
            })}
          </div>
        ) : query ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">検索結果が見つかりませんでした</p>
            <p className="text-gray-500 text-sm">別のキーワードで検索してみてください</p>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default function KeywordSearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KeywordSearchContent />
    </Suspense>
  )
}
