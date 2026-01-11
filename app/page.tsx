import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { CategoryCarousel } from '@/components/CategoryCarousel'
import { Header } from '@/components/Header'

export default function Home() {
  const orderedCategories = [...CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-6 sm:mb-8 fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
            理想の結婚式は、ここにある
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed px-2">
            <span className="sm:hidden">
              理想のプランを<Link href="/wedding-genie" className="text-pink-600 hover:text-pink-700 hover:underline font-semibold transition-colors">WeddingGenie</Link>で見つけましょう。<Link href="/couple/plan" className="text-pink-600 hover:text-pink-700 hover:underline font-semibold transition-colors">PlanBoard</Link>からプランを管理できます。
            </span>
            <span className="hidden sm:inline">
              イメージを<Link href="/wedding-genie" className="text-pink-600 hover:text-pink-700 hover:underline font-semibold transition-colors">WeddingGenie</Link>に入力して、理想の結婚式プランを作り上げましょう。気になるベンダーは詳細から問い合わせて、<Link href="/couple/plan" className="text-pink-600 hover:text-pink-700 hover:underline font-semibold transition-colors">PlanBoard</Link>で全体像を組み立てていきましょう。
            </span>
          </p>
        </div>

        <div className="space-y-2">
          {orderedCategories.map((category) => (
            <CategoryCarousel key={category.name} categoryName={category.name} />
          ))}
        </div>

        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 mt-12 sm:mt-16 md:mt-20 border border-gray-100 fade-in">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">はじめての方へ</h3>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 sm:p-8 border border-pink-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg sm:text-xl text-gray-900">カップルの方</h4>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                会場、写真、ケータリングなど、<br className="sm:hidden" />必要なベンダーをカテゴリから見つけて、<br className="sm:hidden" />詳しい情報を比較できます。<br className="hidden sm:inline" />問い合わせやPlanBoardで結婚式を組み立てましょう。
              </p>
              <Link
                href="/couple/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-pink-700 hover:to-rose-700 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                新規登録
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg sm:text-xl text-gray-900">ベンダーの方</h4>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                プロフィールを登録すると、<br className="sm:hidden" />対応するカテゴリのカルーセル上に表示され、<br className="sm:hidden" />カップルからの問い合わせを受けられます。<br className="hidden sm:inline" />承認制のため、まずは登録をお願いします。
              </p>
              <Link
                href="/vendor/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                新規登録
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
