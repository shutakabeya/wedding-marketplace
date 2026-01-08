'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Vendor {
  id: string
  name: string // 屋号
  bio: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    name: string | null // 出品名（プラン名）
    priceMin: number | null
    priceMax: number | null
    areas: string[]
    profileImages: string[]
    imageUrl: string | null
    categoryType: string | null
    maxGuests: number | null
    serviceTags: string[]
    styleTags: string[]
    services: string | null // 提供内容
  } | null
  profileId?: string // プロフィールID
  gallery: Array<{ imageUrl: string }>
}

interface CategoryCarouselProps {
  categoryName: string
}

export function CategoryCarousel({ categoryName }: CategoryCarouselProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          category: categoryName,
          sort: 'recommended',
          limit: '12',
        })

        const res = await fetch(`/api/vendors?${params.toString()}`)
        const data = await res.json()
        setVendors(data.vendors || [])
      } catch (error) {
        console.error('Failed to fetch vendors for category', categoryName, error)
        setVendors([])
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [categoryName])

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const distance = direction === 'left' ? -320 : 320
    scrollContainerRef.current.scrollBy({
      left: distance,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mb-16 fade-in">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
          {categoryName}
        </h3>
        <Link
          href={`/search?category=${encodeURIComponent(categoryName)}`}
          className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline transition-colors"
        >
          このカテゴリのベンダーをもっと見る →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[300px] bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="w-full h-64 skeleton" />
              <div className="p-6">
                <div className="h-6 w-3/4 skeleton mb-3 rounded" />
                <div className="h-5 w-1/2 skeleton mb-2 rounded" />
                <div className="h-4 w-full skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
          まだこのカテゴリのベンダーは登録されていません。
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            aria-label={`${categoryName}のベンダーを左にスクロール`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            aria-label={`${categoryName}のベンダーを右にスクロール`}
          >
            ›
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          >
            {vendors.map((vendor, index) => (
              <VendorCard key={vendor.id} vendor={vendor} index={index} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

interface VendorCardProps {
  vendor: Vendor
  index: number
}

function VendorCard({ vendor, index }: VendorCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showReadMore, setShowReadMore] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const bioRef = useRef<HTMLParagraphElement>(null)

  const images: string[] = [
    ...(vendor.profile?.profileImages ?? []),
    ...(vendor.profile?.imageUrl ? [vendor.profile.imageUrl] : []),
    ...vendor.gallery.map((g) => g.imageUrl),
  ]

  const hasImages = images.length > 0
  const currentImage = hasImages ? images[Math.min(currentImageIndex, images.length - 1)] : null

  const handleImageNav = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasImages) return
    setCurrentImageIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? images.length - 1 : prev - 1
      }
      return prev === images.length - 1 ? 0 : prev + 1
    })
  }

  const isVenue = vendor.profile?.categoryType === 'venue'
  const locationLabel = isVenue ? '所在地' : 'エリア'

  // 提供内容が3行以上かどうかを判定
  useEffect(() => {
    if (bioRef.current && vendor.profile?.services) {
      const lineHeight = parseFloat(getComputedStyle(bioRef.current).lineHeight)
      const maxHeight = lineHeight * 3 // 3行分の高さ
      const actualHeight = bioRef.current.scrollHeight
      setShowReadMore(actualHeight > maxHeight)
    }
  }, [vendor.profile?.services])

  return (
    <Link
      href={`/vendors/${vendor.id}${vendor.profileId ? `?profileId=${vendor.profileId}` : ''}`}
      className="min-w-[320px] max-w-[320px] bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 border border-gray-100 group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative w-full h-64 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 overflow-hidden">
        {currentImage && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 skeleton" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={vendor.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">写真を準備中</p>
            </div>
          </div>
        )}
        
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-white font-semibold text-lg px-4 py-2 bg-pink-600/90 rounded-lg backdrop-blur-sm">
            詳細を見る
          </span>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => handleImageNav('prev', e)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-lg text-gray-700 shadow-lg z-20 transition-all hover:scale-110"
              aria-label="前の画像"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => handleImageNav('next', e)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-lg text-gray-700 shadow-lg z-20 transition-all hover:scale-110"
              aria-label="次の画像"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-6">
        <h4 className="text-xl font-bold mb-3 text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
          {vendor.profile?.name || vendor.name}
        </h4>
        
        {/* 価格 */}
        {vendor.profile?.priceMin && (
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
            ¥{vendor.profile.priceMin.toLocaleString()}〜
          </div>
        )}

        {/* 所在地/エリア */}
        {vendor.profile?.areas && vendor.profile.areas.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1 font-medium">{vendor.profile.areas[0]}</span>
          </div>
        )}

        {/* 会場の場合：収容人数 */}
        {isVenue && vendor.profile?.maxGuests && (
          <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">{vendor.profile.maxGuests.toLocaleString()}名まで収容可能</span>
          </div>
        )}

        {/* 特徴タグ（serviceTags - 最大3つまで） */}
        {vendor.profile?.serviceTags && vendor.profile.serviceTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {vendor.profile.serviceTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`service-${idx}`}
                className="px-3 py-1 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 text-xs font-medium rounded-full border border-pink-200 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* スタイルタグ（styleTags - 最大3つまで） */}
        {vendor.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {vendor.profile.styleTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`style-${idx}`}
                className="px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 提供内容（プロフィールのservices） */}
        {vendor.profile?.services && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p ref={bioRef} className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {vendor.profile.services}
            </p>
            {showReadMore && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/vendors/${vendor.id}${vendor.profileId ? `?profileId=${vendor.profileId}` : ''}`
                }}
                className="text-sm font-semibold text-pink-600 hover:text-pink-700 hover:underline mt-2 transition-colors"
              >
                続きを読む →
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

