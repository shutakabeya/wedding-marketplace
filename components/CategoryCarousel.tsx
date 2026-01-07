'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Vendor {
  id: string
  name: string
  bio: string | null
  categories: Array<{ category: { name: string } }>
  profile: {
    priceMin: number | null
    priceMax: number | null
    areas: string[]
    profileImages: string[]
    imageUrl: string | null
    categoryType: string | null
    maxGuests: number | null
    serviceTags: string[]
    styleTags: string[]
  } | null
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
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {categoryName}
        </h3>
        <Link
          href={`/search?category=${encodeURIComponent(categoryName)}`}
          className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
        >
          このカテゴリのベンダーをもっと見る
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-6">このカテゴリのベンダーを読み込み中です...</div>
      ) : vendors.length === 0 ? (
        <div className="text-gray-400 text-sm py-6 border border-dashed border-gray-200 rounded-lg text-center">
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
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          >
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

interface VendorCardProps {
  vendor: Vendor
}

function VendorCard({ vendor }: VendorCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showReadMore, setShowReadMore] = useState(false)
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

  // 紹介文が3行以上かどうかを判定
  useEffect(() => {
    if (bioRef.current && vendor.bio) {
      const lineHeight = parseFloat(getComputedStyle(bioRef.current).lineHeight)
      const maxHeight = lineHeight * 3 // 3行分の高さ
      const actualHeight = bioRef.current.scrollHeight
      setShowReadMore(actualHeight > maxHeight)
    }
  }, [vendor.bio])

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="min-w-[300px] max-w-[300px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
    >
      {currentImage && (
        <div className="relative w-full h-56 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={vendor.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => handleImageNav('prev', e)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-sm text-gray-700 shadow-md z-10"
                aria-label="前の画像"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => handleImageNav('next', e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-sm text-gray-700 shadow-md z-10"
                aria-label="次の画像"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="p-4">
        <h4 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-1">{vendor.name}</h4>
        
        {/* 価格 */}
        {vendor.profile?.priceMin && (
          <div className="text-base font-semibold text-pink-600 mb-2">
            ¥{vendor.profile.priceMin.toLocaleString()}〜
          </div>
        )}

        {/* 所在地/エリア */}
        {vendor.profile?.areas && vendor.profile.areas.length > 0 && (
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{vendor.profile.areas[0]}</span>
          </div>
        )}

        {/* 会場の場合：収容人数 */}
        {isVenue && vendor.profile?.maxGuests && (
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{vendor.profile.maxGuests.toLocaleString()}名まで収容可能</span>
          </div>
        )}

        {/* 特徴タグ（serviceTags - 最大3つまで） */}
        {vendor.profile?.serviceTags && vendor.profile.serviceTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {vendor.profile.serviceTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`service-${idx}`}
                className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* スタイルタグ（styleTags - 最大3つまで） */}
        {vendor.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {vendor.profile.styleTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`style-${idx}`}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 紹介文 */}
        {vendor.bio && (
          <div className="mt-2">
            <p ref={bioRef} className="text-sm text-gray-600 line-clamp-3">
              {vendor.bio}
            </p>
            {showReadMore && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/vendors/${vendor.id}`
                }}
                className="text-sm text-pink-600 hover:text-pink-700 hover:underline mt-1 font-medium"
              >
                Read More...
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

