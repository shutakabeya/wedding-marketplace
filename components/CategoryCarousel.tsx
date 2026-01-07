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
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="min-w-[260px] max-w-[260px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                {vendor.gallery.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vendor.gallery[0].imageUrl}
                    alt={vendor.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="text-base font-semibold mb-1 text-gray-900 line-clamp-1">{vendor.name}</h4>
                  <div className="text-xs text-gray-500 mb-1">
                    {vendor.categories.map((c) => c.category.name).join(', ')}
                  </div>
                  {vendor.profile && (
                    <div className="text-sm font-medium text-pink-600 mb-2">
                      {vendor.profile.priceMin && (
                        <>
                          ¥{vendor.profile.priceMin.toLocaleString()}〜
                        </>
                      )}
                      {vendor.profile.priceMax && (
                        <>
                          ¥{vendor.profile.priceMax.toLocaleString()}
                        </>
                      )}
                    </div>
                  )}
                  {vendor.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2">{vendor.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

