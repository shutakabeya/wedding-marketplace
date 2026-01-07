import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { CategoryCarousel } from '@/components/CategoryCarousel'
import { Header } from '@/components/Header'

export default function Home() {
  const orderedCategories = [...CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            理想の結婚式は、ここにある
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-sm sm:text-base">
            会場・写真・ドレス・ケータリングなど、結婚式に必要なベンダーをカテゴリ別に一覧できます。
            気になるベンダーは詳細から問い合わせて、<Link href="/couple/plan" className="text-pink-600 hover:text-pink-700 hover:underline font-medium">PlanBoard</Link>で全体像を組み立てていきましょう。
          </p>
        </div>

        <div className="space-y-2">
          {orderedCategories.map((category) => (
            <CategoryCarousel key={category.name} categoryName={category.name} />
          ))}
        </div>

        <section className="bg-white rounded-lg shadow-md p-8 mt-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">はじめての方へ</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">カップルの方</h4>
              <p className="text-gray-600 mb-4">
                会場、写真、ケータリングなど、必要なベンダーをカテゴリから見つけて、詳しい情報を比較できます。
                問い合わせやPlanBoardで結婚式を組み立てましょう。
              </p>
              <Link
                href="/couple/signup"
                className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
              >
                新規登録
              </Link>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">ベンダーの方</h4>
              <p className="text-gray-600 mb-4">
                プロフィールを登録すると、対応するカテゴリのカルーセル上に表示され、カップルからの問い合わせを受けられます。
                承認制のため、まずは登録をお願いします。
              </p>
              <Link
                href="/vendor/signup"
                className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
              >
                新規登録
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
