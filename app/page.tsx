import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { CategoryCarousel } from '@/components/CategoryCarousel'
import { Header } from '@/components/Header'

export default function Home() {
  const orderedCategories = [...CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-16 fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
            理想の結婚式は、ここにある
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-700 leading-relaxed">
            会場・写真・ドレス・ケータリングなど、結婚式に必要なベンダーをカテゴリ別に一覧できます。
            気になるベンダーは詳細から問い合わせて、<Link href="/couple/plan" className="text-pink-600 hover:text-pink-700 hover:underline font-semibold transition-colors">PlanBoard</Link>で全体像を組み立てていきましょう。
          </p>
        </div>

        <div className="space-y-2">
          {orderedCategories.map((category) => (
            <CategoryCarousel key={category.name} categoryName={category.name} />
          ))}
        </div>

        <section className="bg-white rounded-2xl shadow-xl p-10 md:p-12 mt-20 border border-gray-100 fade-in">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">はじめての方へ</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-8 border border-pink-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-gray-900">カップルの方</h4>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                会場、写真、ケータリングなど、必要なベンダーをカテゴリから見つけて、詳しい情報を比較できます。
                問い合わせやPlanBoardで結婚式を組み立てましょう。
              </p>
              <Link
                href="/couple/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                新規登録
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-gray-900">ベンダーの方</h4>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                プロフィールを登録すると、対応するカテゴリのカルーセル上に表示され、カップルからの問い合わせを受けられます。
                承認制のため、まずは登録をお願いします。
              </p>
              <Link
                href="/vendor/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                新規登録
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
