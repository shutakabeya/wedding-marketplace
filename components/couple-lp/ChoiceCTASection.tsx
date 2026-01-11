'use client'

import Link from 'next/link'

export function ChoiceCTASection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-12">
          ここまで読んだなら、次はどれでもOKです。
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <Link
            href="/wedding-genie"
            className="px-6 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-400 hover:border-gray-500 shadow-md hover:shadow-lg transition-all hover:scale-105 text-base sm:text-lg"
          >
            まず仕組みを体験する（Genie）
          </Link>
          
          <Link
            href="/search"
            className="px-6 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-400 hover:border-gray-500 shadow-md hover:shadow-lg transition-all hover:scale-105 text-base sm:text-lg"
          >
            プラン例を眺める
          </Link>
          
          <Link
            href="/couple/plan"
            className="px-6 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-400 hover:border-gray-500 shadow-md hover:shadow-lg transition-all hover:scale-105 text-base sm:text-lg"
          >
            PlanBoardの管理画面を見る
          </Link>
        </div>

        <p className="text-sm sm:text-base text-gray-700">
          押しません。<br />
          あなたのペースで、作り直せばいい。
        </p>
      </div>
    </section>
  )
}