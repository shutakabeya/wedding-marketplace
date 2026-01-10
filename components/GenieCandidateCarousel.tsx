'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getDisplayName } from '@/lib/areas'

interface VendorCandidate {
  vendorId: string
  profileId: string
  name: string
  priceMin: number | null
  priceMax: number | null
  actualPrice: number | null
  plans?: Array<{ name: string; price: number; description?: string }>
}

interface Vendor {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  profile: {
    id: string
    name: string | null
    priceMin: number | null
    priceMax: number | null
    areas: string[]
    profileImages: string[]
    imageUrl: string | null
    categoryType: string | null
    maxGuests: number | null
    serviceTags: string[]
    styleTags: string[]
    services: string | null
  } | null
  profileId?: string
  gallery: Array<{ imageUrl: string }>
}

interface GenieCandidateCarouselProps {
  categoryName: string
  categoryId: string
  candidates: VendorCandidate[]
  selectedCandidates: Set<string> // vendorId-profileIdの形式
  onSelectChange: (vendorId: string, profileId: string, selected: boolean) => void
  formatCurrency: (amount: number | null) => string
}

export function GenieCandidateCarousel({
  categoryName,
  categoryId,
  candidates,
  selectedCandidates,
  onSelectChange,
  formatCurrency,
}: GenieCandidateCarouselProps) {
  // 候補ごとにベンダー情報を管理（vendorId-profileIdのキーで管理）
  const [vendorsMap, setVendorsMap] = useState<Map<string, Vendor>>(new Map())
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (candidates.length === 0) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // 各候補のベンダー情報を取得（候補ごとに個別に管理）
        const vendorPromises = candidates.map(async (candidate) => {
          const key = `${candidate.vendorId}-${candidate.profileId}`
          try {
            const res = await fetch(
              `/api/vendors/${candidate.vendorId}?profileId=${candidate.profileId}`
            )
            if (!res.ok) return { key, vendor: null }
            const data = await res.json()
            return { key, vendor: data.vendor as Vendor }
          } catch (error) {
            console.error(`Failed to fetch vendor ${candidate.vendorId} profile ${candidate.profileId}:`, error)
            return { key, vendor: null }
          }
        })

        const vendorResults = await Promise.all(vendorPromises)
        const newVendorsMap = new Map<string, Vendor>()
        vendorResults.forEach(({ key, vendor }) => {
          if (vendor) {
            newVendorsMap.set(key, vendor)
          }
        })
        setVendorsMap(newVendorsMap)
      } catch (error) {
        console.error('Failed to fetch vendor details:', error)
        setVendorsMap(new Map())
      } finally {
        setLoading(false)
      }
    }

    fetchVendorDetails()
  }, [candidates])

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const distance = direction === 'left' ? -320 : 320
    scrollContainerRef.current.scrollBy({
      left: distance,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mb-12 fade-in">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-6">
        {categoryName}
      </h3>

      {loading ? (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="min-w-[320px] bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="w-full h-64 skeleton" />
              <div className="p-6">
                <div className="h-6 w-3/4 skeleton mb-3 rounded" />
                <div className="h-5 w-1/2 skeleton mb-2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
          このカテゴリの候補が見つかりませんでした。
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center h-12 w-12 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 transition-all"
            aria-label={`${categoryName}の候補を左にスクロール`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center h-12 w-12 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 transition-all"
            aria-label={`${categoryName}の候補を右にスクロール`}
          >
            ›
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          >
            {candidates.map((candidate, index) => {
              const selectionKey = `${candidate.vendorId}-${candidate.profileId}`
              const vendor = vendorsMap.get(selectionKey) // 候補ごとのベンダー情報を取得
              const isSelected = selectedCandidates.has(selectionKey)

              return (
                <GenieVendorCard
                  key={selectionKey}
                  candidate={candidate}
                  vendor={vendor}
                  index={index}
                  isSelected={isSelected}
                  onSelectChange={(selected) =>
                    onSelectChange(candidate.vendorId, candidate.profileId, selected)
                  }
                  formatCurrency={formatCurrency}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

interface GenieVendorCardProps {
  candidate: VendorCandidate
  vendor: Vendor | undefined
  index: number
  isSelected: boolean
  onSelectChange: (selected: boolean) => void
  formatCurrency: (amount: number | null) => string
}

function GenieVendorCard({
  candidate,
  vendor,
  index,
  isSelected,
  onSelectChange,
  formatCurrency,
}: GenieVendorCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showReadMore, setShowReadMore] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const bioRef = useRef<HTMLParagraphElement>(null)

  const images: string[] = [
    ...(vendor?.profile?.profileImages ?? []),
    ...(vendor?.profile?.imageUrl ? [vendor.profile.imageUrl] : []),
    ...(vendor?.gallery.map((g) => g.imageUrl) ?? []),
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

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectChange(!isSelected)
  }

  const isVenue = vendor?.profile?.categoryType === 'venue'
  const locationLabel = isVenue ? '所在地' : 'エリア'

  // 提供内容が3行以上かどうかを判定
  useEffect(() => {
    if (bioRef.current && vendor?.profile?.services) {
      const lineHeight = parseFloat(getComputedStyle(bioRef.current).lineHeight)
      const maxHeight = lineHeight * 3 // 3行分の高さ
      const actualHeight = bioRef.current.scrollHeight
      setShowReadMore(actualHeight > maxHeight)
    }
  }, [vendor?.profile?.services])

  const detailUrl = `/vendors/${candidate.vendorId}${candidate.profileId ? `?profileId=${candidate.profileId}&returnTo=/wedding-genie` : '?returnTo=/wedding-genie'}`

  return (
    <div
      className={`min-w-[320px] md:min-w-[360px] max-w-[320px] md:max-w-[360px] bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 snap-start border-2 relative group ${
        isSelected
          ? 'border-pink-500 shadow-2xl scale-[1.02]'
          : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* チェックボックス */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={handleCheckboxChange}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-pink-600 border-pink-600'
              : 'bg-white border-gray-300 hover:border-pink-400'
          }`}
          aria-label={isSelected ? '選択を解除' : '選択'}
        >
          {isSelected && (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* クリック可能なリンクオーバーレイ */}
      <Link
        href={detailUrl}
        className="absolute inset-0 z-10"
        onClick={(e) => {
          // チェックボックスのクリックは阻止しない
          const target = e.target as HTMLElement
          if (target.closest('button') || target.closest('input')) {
            e.preventDefault()
          }
        }}
      />

      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 overflow-hidden cursor-pointer">
        {currentImage && !imageError ? (
          <>
            {imageLoading && <div className="absolute inset-0 skeleton" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={candidate.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
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
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-400">写真を準備中</p>
            </div>
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => handleImageNav('prev', e)}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg text-gray-700 shadow-lg z-20 transition-all hover:scale-110"
              aria-label="前の画像"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => handleImageNav('next', e)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg text-gray-700 shadow-lg z-20 transition-all hover:scale-110"
              aria-label="次の画像"
            >
              ›
            </button>
            <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-5 sm:w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4 sm:p-5 md:p-6">
        <h4 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
          {vendor?.profile?.name || candidate.name}
        </h4>

        {/* 価格（上に表示） */}
        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2 sm:mb-3">
          {formatCurrency(candidate.actualPrice)}
        </div>

        {/* 所在地/エリア */}
        {vendor?.profile?.areas && vendor.profile.areas.length > 0 && (
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1 font-medium">
              {getDisplayName(vendor.profile.areas[0])}
            </span>
          </div>
        )}

        {/* 会場の場合：収容人数 */}
        {isVenue && vendor?.profile?.maxGuests && (
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="font-medium">
              {vendor.profile.maxGuests.toLocaleString()}名まで収容可能
            </span>
          </div>
        )}

        {/* 特徴タグ（serviceTags - 最大3つまで） */}
        {vendor?.profile?.serviceTags && vendor.profile.serviceTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {vendor.profile.serviceTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`service-${idx}`}
                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 text-[10px] sm:text-xs font-medium rounded-full border border-pink-200 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* スタイルタグ（styleTags - 最大3つまで） */}
        {vendor?.profile?.styleTags && vendor.profile.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {vendor.profile.styleTags.slice(0, 3).map((tag, idx) => (
              <span
                key={`style-${idx}`}
                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full border border-purple-200 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 提供内容（プロフィールのservices） */}
        {vendor?.profile?.services && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <p ref={bioRef} className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {vendor.profile.services}
            </p>
            {showReadMore && (
              <Link
                href={`/vendors/${candidate.vendorId}${candidate.profileId ? `?profileId=${candidate.profileId}` : ''}`}
                className="text-xs sm:text-sm font-semibold text-pink-600 hover:text-pink-700 hover:underline mt-1.5 sm:mt-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                続きを読む →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
