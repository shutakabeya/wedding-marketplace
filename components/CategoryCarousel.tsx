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

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="min-w-[260px] max-w-[260px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
    >
      {currentImage && (
        <div className="relative w-full h-40 bg-gray-100">
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
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center text-xs text-gray-700 shadow"
                aria-label="前の画像"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => handleImageNav('next', e)}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-7 h-7 flex items中心 justify-center text-xs text-gray-700 shadow"
                aria-label="次の画像"
              >
                ›
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
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
        <h4 className="text-base font-semibold mb-1 text-gray-900 line-clamp-1">{vendor.name}</h4>
        {/* カテゴリ名はトップでは不要（カテゴリごとに並んでいるため） */}
        {vendor.profile && (
          <div className="text-sm font-medium text-pink-600 mb-2">
            {vendor.profile.priceMin && (
              <>¥{vendor.profile.priceMin.toLocaleString()}〜</>
            )}
            {vendor.profile.priceMax && (
              <>¥{vendor.profile.priceMax.toLocaleString()}</>
            )}
          </div>
        )}
        {vendor.bio && (
          <p className="text-xs text-gray-600 line-clamp-2">{vendor.bio}</p>
        )}
      </div>
    </Link>
  )
}

