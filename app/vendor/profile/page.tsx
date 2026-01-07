'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

interface Vendor {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  categories: Array<{ category: { id: string; name: string } }>
  profile: {
    imageUrl: string | null
    profileImages: string[]
    areas: string[]
    priceMin: number | null
    priceMax: number | null
    styleTags: string[]
    services: string | null
    constraints: string | null
    categoryType: 'venue' | 'photographer' | 'dress' | 'planner' | 'other'
    maxGuests: number | null
    serviceTags: string[]
    plans: Array<{
      name: string
      price: number
      description?: string | null
    }>
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
    logoUrl: '',
    categoryIds: [] as string[],
    areas: [] as string[],
    areaInput: '',
    priceMin: '',
    priceMax: '',
    styleTags: [] as string[],
    styleTagInput: '',
    services: '',
    constraints: '',
    profileImages: [] as string[], // プロフィール画像（最大3枚）
    categoryType: 'venue' as 'venue' | 'photographer' | 'dress' | 'planner' | 'other',
    maxGuests: '',
    serviceTags: [] as string[],
    serviceTagInput: '',
    plans: [] as Array<{ name: string; price: string; description: string }>,
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingProfileImages, setUploadingProfileImages] = useState<boolean[]>([])

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
        logoUrl: v.logoUrl || '',
        categoryIds: v.categories.map((c: any) => c.category.id),
        areas: v.profile?.areas || [],
        areaInput: '',
        priceMin: v.profile?.priceMin?.toString() || '',
        priceMax: v.profile?.priceMax?.toString() || '',
        styleTags: v.profile?.styleTags || [],
        styleTagInput: '',
        services: v.profile?.services || '',
        constraints: v.profile?.constraints || '',
        profileImages: v.profile?.profileImages || (v.profile?.imageUrl ? [v.profile.imageUrl] : []),
        categoryType: v.profile?.categoryType || 'venue',
        maxGuests: v.profile?.maxGuests?.toString() || '',
        serviceTags: v.profile?.serviceTags || [],
        serviceTagInput: '',
        plans:
          v.profile?.plans?.map((p) => ({
            name: p.name,
            price: p.price.toString(),
            description: p.description || '',
          })) || [],
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      alert('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'profile', index?: number) => {
    const formDataToSend = new FormData()
    formDataToSend.append('file', file)
    formDataToSend.append('type', type)

    if (type === 'logo') {
      setUploadingLogo(true)
    } else {
      const newUploading = [...uploadingProfileImages]
      if (index !== undefined) {
        newUploading[index] = true
      } else {
        newUploading.push(true)
      }
      setUploadingProfileImages(newUploading)
    }

    try {
      const res = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '画像のアップロードに失敗しました')
      }

      const data = await res.json()

      if (type === 'logo') {
        setFormData({ ...formData, logoUrl: data.imageUrl })
      } else {
        const newImages = [...formData.profileImages]
        if (index !== undefined && index < newImages.length) {
          newImages[index] = data.imageUrl
        } else {
          if (newImages.length < 3) {
            newImages.push(data.imageUrl)
          } else {
            throw new Error('プロフィール画像は最大3枚までです')
          }
        }
        setFormData({ ...formData, profileImages: newImages })
      }

      return data.imageUrl
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      alert(error.message || '画像のアップロードに失敗しました')
      throw error
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        const newUploading = [...uploadingProfileImages]
        if (index !== undefined && index < newUploading.length) {
          newUploading[index] = false
        } else {
          newUploading.pop()
        }
        setUploadingProfileImages(newUploading)
      }
    }
  }

  const removeProfileImage = (index: number) => {
    const newImages = formData.profileImages.filter((_, i) => i !== index)
    setFormData({ ...formData, profileImages: newImages })
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
          logoUrl: formData.logoUrl || null,
          categoryIds: formData.categoryIds,
          areas: formData.areas,
          styleTags: formData.styleTags,
          services: formData.services || null,
          constraints: formData.constraints || null,
          profileImages: formData.profileImages,
          categoryType: formData.categoryType,
          maxGuests: formData.maxGuests ? parseInt(formData.maxGuests, 10) : null,
          serviceTags: formData.styleTags, // シンプルに同じタグをサービス特徴としても利用
          plans: formData.plans
            .filter((p) => p.name.trim() && p.price.trim())
            .map((p) => ({
              name: p.name.trim(),
              price: parseInt(p.price, 10),
              description: p.description.trim() || null,
            })),
        }),
      })

      if (!res.ok) {
        let errorMessage = '更新に失敗しました'
        try {
          const data = await res.json()
          errorMessage = data.error || errorMessage
          if (data.details) {
            console.error('Validation details:', data.details)
            errorMessage += '\n詳細: ' + JSON.stringify(data.details)
          }
        } catch (parseError) {
          // JSONパースに失敗した場合、レスポンステキストを取得
          const text = await res.text()
          console.error('Error response:', text)
          errorMessage = `更新に失敗しました (${res.status}: ${res.statusText})`
        }
        throw new Error(errorMessage)
      }

      alert('プロフィールを更新しました')
      router.push('/vendor/dashboard')
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              {/* 業種カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  業種カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryType: e.target.value as
                        | 'venue'
                        | 'photographer'
                        | 'dress'
                        | 'planner'
                        | 'other',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="venue">会場（Wedding Venue）</option>
                  <option value="photographer">カメラマン（Photographer）</option>
                  <option value="dress">ドレス・ブライダルショップ</option>
                  <option value="planner">プランナー / コーディネーター</option>
                  <option value="other">その他</option>
                </select>
              </div>
              {/* ロゴ画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ロゴ画像
                </label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt="ロゴ"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            await handleImageUpload(file, 'logo')
                          } catch (error) {
                            // エラーは既にalertで表示済み
                          }
                        }
                      }}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG、PNG、WebP形式、5MB以下
                    </p>
                  </div>
                </div>
              </div>

              {/* プロフィール画像（最大3枚） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール画像（最大3枚）
                  <span className="text-gray-500 text-xs ml-2">
                    事業者の魅力が伝わる画像を選んでください
                  </span>
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {formData.profileImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`プロフィール画像 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeProfileImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          aria-label="画像を削除"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.profileImages.length < 3 && (
                      <div className="relative">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-400 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-2 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <p className="text-xs text-gray-500">画像を追加</p>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  await handleImageUpload(file, 'profile')
                                } catch (error) {
                                  // エラーは既にalertで表示済み
                                }
                              }
                              e.target.value = ''
                            }}
                            disabled={uploadingProfileImages.some((u) => u)}
                          />
                        </label>
                        {uploadingProfileImages[formData.profileImages.length] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                            <div className="text-sm text-gray-600">アップロード中...</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPEG、PNG、WebP形式、5MB以下。事業者の魅力が伝わる画像を選んでください。
                  </p>
                </div>
              </div>

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

          {/* 料金プラン */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">料金プラン</h2>
            <p className="text-sm text-gray-600 mb-3">
              いくつかの料金プランと内容を登録してください。最安値のプラン料金が「¥◯◯◯◯〜」として表示されます。
            </p>
            <div className="space-y-4">
              {formData.plans.map((plan, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      プラン {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          plans: formData.plans.filter((_, i) => i !== index),
                        })
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        プラン名
                      </label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const newPlans = [...formData.plans]
                          newPlans[index] = { ...newPlans[index], name: e.target.value }
                          setFormData({ ...formData, plans: newPlans })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="例: フルプランニング / 3時間撮影プラン など"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        料金（円）
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const newPlans = [...formData.plans]
                          newPlans[index] = { ...newPlans[index], price: e.target.value }
                          setFormData({ ...formData, plans: newPlans })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="例: 50000"
                        min={0}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={plan.description}
                      onChange={(e) => {
                        const newPlans = [...formData.plans]
                        newPlans[index] = { ...newPlans[index], description: e.target.value }
                        setFormData({ ...formData, plans: newPlans })
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="例: 挙式＋披露宴のフルサポート、衣装・メイク込み など"
                    />
                  </div>
                </div>
              ))}
              {formData.plans.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      plans: [
                        ...formData.plans,
                        { name: '', price: '', description: '' },
                      ],
                    })
                  }
                  className="px-4 py-2 text-sm bg-pink-50 text-pink-700 border border-pink-200 rounded-md hover:bg-pink-100"
                >
                  + プランを追加
                </button>
              )}
            </div>
          </div>

          {/* スタイルタグ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {formData.categoryType === 'venue'
                ? '設備・特徴タグ'
                : formData.categoryType === 'photographer'
                ? 'サービス特徴タグ'
                : formData.categoryType === 'dress'
                ? 'ショップの特徴タグ'
                : formData.categoryType === 'planner'
                ? '提供範囲・特徴タグ'
                : '特徴タグ'}
            </h2>
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

        {/* 複数プロフィール管理 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">複数プロフィール管理</h2>
          <p className="text-sm text-gray-600 mb-4">
            エリアや価格帯が異なる複数のプロフィールを作成できます。デフォルトプロフィールは検索結果に表示されます。
          </p>
          <ProfilesManager />
        </div>
      </div>
    </div>
  )
}

// 複数プロフィール管理コンポーネント
function ProfilesManager() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Array<{
    id: string
    name: string
    isDefault: boolean
    areas: string[]
    priceMin: number | null
    priceMax: number | null
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    areas: [] as string[],
    areaInput: '',
    priceMin: '',
    priceMax: '',
    styleTags: [] as string[],
    styleTagInput: '',
    services: '',
    constraints: '',
    isDefault: false,
  })

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/vendor/profiles')
      if (res.status === 401) {
        router.push('/vendor/login')
        return
      }
      if (!res.ok) {
        throw new Error('プロフィールの取得に失敗しました')
      }
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Failed to load profiles:', error)
      alert('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/vendor/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          areas: formData.areas,
          priceMin: formData.priceMin ? parseInt(formData.priceMin) : null,
          priceMax: formData.priceMax ? parseInt(formData.priceMax) : null,
          styleTags: formData.styleTags,
          services: formData.services || null,
          constraints: formData.constraints || null,
          isDefault: formData.isDefault,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '作成に失敗しました')
        return
      }

      alert('プロフィールを作成しました')
      setShowCreateForm(false)
      setFormData({
        name: '',
        areas: [],
        areaInput: '',
        priceMin: '',
        priceMax: '',
        styleTags: [],
        styleTagInput: '',
        services: '',
        constraints: '',
        isDefault: false,
      })
      await loadProfiles()
    } catch (error) {
      console.error('Failed to create profile:', error)
      alert('作成に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このプロフィールを削除しますか？')) return

    try {
      const res = await fetch(`/api/vendor/profiles/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '削除に失敗しました')
        return
      }

      alert('プロフィールを削除しました')
      await loadProfiles()
    } catch (error) {
      console.error('Failed to delete profile:', error)
      alert('削除に失敗しました')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!res.ok) {
        throw new Error('デフォルト設定に失敗しました')
      }

      await loadProfiles()
    } catch (error) {
      console.error('Failed to set default:', error)
      alert('デフォルト設定に失敗しました')
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

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      {/* プロフィール一覧 */}
      <div className="space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-4 border-2 rounded-lg ${
              profile.isDefault
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                  {profile.isDefault && (
                    <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded">
                      デフォルト
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {profile.areas.length > 0 && (
                    <div>対応エリア: {profile.areas.join(', ')}</div>
                  )}
                  {(profile.priceMin || profile.priceMax) && (
                    <div>
                      価格: {profile.priceMin && `¥${profile.priceMin.toLocaleString()}〜`}
                      {profile.priceMax && `¥${profile.priceMax.toLocaleString()}`}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!profile.isDefault && (
                  <button
                    onClick={() => handleSetDefault(profile.id)}
                    className="px-3 py-1 bg-pink-600 text-white rounded text-sm hover:bg-pink-700"
                  >
                    デフォルトに設定
                  </button>
                )}
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  disabled={profile.isDefault}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新規作成フォーム */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-500 hover:text-pink-600 transition-colors"
        >
          + 新しいプロフィールを作成
        </button>
      ) : (
        <div className="border-2 border-pink-200 rounded-lg p-4 bg-pink-50">
          <h3 className="font-semibold mb-4">新しいプロフィール</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロフィール名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 東京エリア向け"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対応エリア
              </label>
              <div className="flex gap-2 mb-2">
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
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <span className="text-sm text-gray-700">デフォルトプロフィールに設定</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({
                    name: '',
                    areas: [],
                    areaInput: '',
                    priceMin: '',
                    priceMax: '',
                    styleTags: [],
                    styleTagInput: '',
                    services: '',
                    constraints: '',
                    isDefault: false,
                  })
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
