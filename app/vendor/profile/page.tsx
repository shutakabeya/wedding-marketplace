'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vendor {
  id: string
  name: string
  bio: string | null
  categories: Array<{ category: { id: string; name: string } }>
  profile: {
    areas: string[]
    priceMin: number | null
    priceMax: number | null
    styleTags: string[]
    services: string | null
    constraints: string | null
  } | null
  gallery: Array<{ id: string; imageUrl: string; caption: string | null }>
}

export default function VendorProfilePage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    categoryIds: [] as string[],
    areas: [] as string[],
    areaInput: '',
    priceMin: '',
    priceMax: '',
    styleTags: [] as string[],
    styleTagInput: '',
    services: '',
    constraints: '',
  })

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadCategories()
    loadProfile()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/vendor/profile')
      if (res.status === 401) {
        router.push('/vendor/login')
        return
      }
      if (!res.ok) {
        throw new Error('プロフィールの取得に失敗しました')
      }
      const data = await res.json()
      const v = data.vendor
      setVendor(v)
      setFormData({
        name: v.name || '',
        bio: v.bio || '',
        categoryIds: v.categories.map((c: any) => c.category.id),
        areas: v.profile?.areas || [],
        areaInput: '',
        priceMin: v.profile?.priceMin?.toString() || '',
        priceMax: v.profile?.priceMax?.toString() || '',
        styleTags: v.profile?.styleTags || [],
        styleTagInput: '',
        services: v.profile?.services || '',
        constraints: v.profile?.constraints || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      alert('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio || null,
          categoryIds: formData.categoryIds,
          areas: formData.areas,
          priceMin: formData.priceMin ? parseInt(formData.priceMin) : null,
          priceMax: formData.priceMax ? parseInt(formData.priceMax) : null,
          styleTags: formData.styleTags,
          services: formData.services || null,
          constraints: formData.constraints || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      alert('プロフィールを更新しました')
      await loadProfile()
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      alert(error.message || '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addArea = () => {
    if (formData.areaInput.trim() && !formData.areas.includes(formData.areaInput.trim())) {
      setFormData({
        ...formData,
        areas: [...formData.areas, formData.areaInput.trim()],
        areaInput: '',
      })
    }
  }

  const removeArea = (area: string) => {
    setFormData({
      ...formData,
      areas: formData.areas.filter((a) => a !== area),
    })
  }

  const addStyleTag = () => {
    if (formData.styleTagInput.trim() && !formData.styleTags.includes(formData.styleTagInput.trim())) {
      setFormData({
        ...formData,
        styleTags: [...formData.styleTags, formData.styleTagInput.trim()],
        styleTagInput: '',
      })
    }
  }

  const removeStyleTag = (tag: string) => {
    setFormData({
      ...formData,
      styleTags: formData.styleTags.filter((t) => t !== tag),
    })
  }

  const toggleCategory = (categoryId: string) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.includes(categoryId)
        ? formData.categoryIds.filter((id) => id !== categoryId)
        : [...formData.categoryIds, categoryId],
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/vendor/dashboard" className="text-pink-600 hover:underline">
            ← ダッシュボードに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">プロフィール編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  屋号・名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ベンダーの紹介文を入力してください"
                />
              </div>
            </div>
          </div>

          {/* カテゴリ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">カテゴリ</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => {
                const isSelected = formData.categoryIds.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-4 py-2 rounded-md border-2 ${
                      isSelected
                        ? 'bg-pink-50 border-pink-500 text-pink-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              選択中: {formData.categoryIds.length}件
            </p>
          </div>

          {/* 対応エリア */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">対応エリア</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={formData.areaInput}
                onChange={(e) => setFormData({ ...formData, areaInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArea()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 東京都"
              />
              <button
                type="button"
                onClick={addArea}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm flex items-center gap-2"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeArea(area)}
                    className="text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 価格帯 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">価格帯</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最低価格（円）
                </label>
                <input
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="例: 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最高価格（円）
                </label>
                <input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="例: 200000"
                />
              </div>
            </div>
          </div>

          {/* スタイルタグ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">スタイルタグ</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={formData.styleTagInput}
                onChange={(e) => setFormData({ ...formData, styleTagInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addStyleTag()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: ナチュラル、エレガント"
              />
              <button
                type="button"
                onClick={addStyleTag}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.styleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeStyleTag(tag)}
                    className="text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 提供内容 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">提供内容</h2>
            <textarea
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="提供するサービス内容を詳しく記入してください"
            />
          </div>

          {/* 制約・注意事項 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">制約・注意事項</h2>
            <textarea
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="制約や注意事項があれば記入してください"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-pink-600 text-white py-3 rounded-md hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <Link
              href="/vendor/dashboard"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
