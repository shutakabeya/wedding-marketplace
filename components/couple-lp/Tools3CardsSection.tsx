'use client'

import Link from 'next/link'

export function Tools3CardsSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section id="tools" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            成立させる仕組み
          </h2>
          <p className="text-lg sm:text-xl text-gray-700">
            結婚式を&quot;作り直す&quot;ための、3つのツール
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {/* Card A: PlanBoard */}
          <div className="bg-gray-50 rounded-xl p-6 lg:p-8 border-2 border-gray-300 shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              PlanBoard
            </h3>
            <p className="text-base font-semibold text-pink-600 mb-4">
              結婚式全体を「見える化」する基盤
            </p>
            
            <p className="text-sm sm:text-base text-gray-800 mb-6 leading-relaxed">
              カテゴリごとにベンダー候補を追加するだけで、料金や選択肢が一覧で揃います。その後のToDoや進行も、最後まで伴走します。
            </p>

            {/* ミニモック */}
            <div className="bg-white rounded-lg p-4 mb-6 space-y-3 text-sm border-2 border-gray-300">
              <div>
                <div className="font-semibold text-gray-900 mb-1">会場：候補3件</div>
                <div className="text-gray-600 text-xs">¥ / 収容 / 条件</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">写真：候補3件</div>
                <div className="text-gray-600 text-xs">¥ / 納品 / 交通費</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">ドレス：候補3件</div>
                <div className="text-gray-600 text-xs">¥ / 試着 / 返却</div>
              </div>
              <div className="pt-3 border-t border-gray-300">
                <div className="font-bold text-gray-900">合計見積：¥X,XXX,XXX（自動集計）</div>
              </div>
              <div className="text-gray-600 text-xs">
                次のToDo：打ち合わせ日程を決める / 見積を揃える / 当日タイムライン確認
              </div>
            </div>

            <button
              onClick={() => scrollToSection('planboard-demo')}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all text-sm sm:text-base"
            >
              PlanBoardの画面を見る
            </button>
          </div>

          {/* Card B: Wedding Genie */}
          <div className="bg-gray-50 rounded-xl p-6 lg:p-8 border-2 border-gray-300 shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Wedding Genie
            </h3>
            <p className="text-base font-semibold text-purple-600 mb-4">
              考えなくても、ちゃんとした叩きが出る
            </p>
            
            <p className="text-sm sm:text-base text-gray-800 mb-6 leading-relaxed">
              予算・場所・人数などの状況と、重視したいこと／自分で用意するものを入力するだけで、各カテゴリのベンダー候補が&quot;そのまま使える形&quot;で提案されます。
            </p>

            {/* ミニモック */}
            <div className="bg-white rounded-lg p-4 mb-6 space-y-3 text-sm border-2 border-gray-300">
              <div>
                <div className="text-gray-700 text-xs mb-1">予算：〜万円</div>
                <div className="text-gray-700 text-xs mb-1">エリア：千葉/東京/その他</div>
                <div className="text-gray-700 text-xs mb-1">人数：〜人</div>
                <div className="text-gray-700 text-xs">重視：料理 / 写真 / 雰囲気 / 価格 / 自由度</div>
              </div>
              <div className="pt-3 border-t-2 border-gray-300">
                <div className="font-semibold text-gray-900 mb-1">会場：候補A/B/C（理由1行つき）</div>
                <div className="font-semibold text-gray-900 mb-1">写真：候補A/B/C（理由1行つき）</div>
              </div>
              <div className="text-purple-600 text-xs font-semibold">
                「このままPlanBoardに追加」（ワンクリック）
              </div>
            </div>

            <Link
              href="/wedding-genie"
              className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-center text-sm sm:text-base"
            >
              自分の場合を作ってみる（2分）
            </Link>
          </div>

          {/* Card C: Day-of Planner */}
          <div className="bg-gray-50 rounded-xl p-6 lg:p-8 border-2 border-gray-300 shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Day-of Planner
            </h3>
            <p className="text-base font-semibold text-indigo-600 mb-4">
              当日だけは、任せていい
            </p>
            
            <p className="text-sm sm:text-base text-gray-800 mb-6 leading-relaxed">
              当日の進行、ベンダー連携、トラブル対応。結婚式当日の&quot;現場&quot;を仕切る責任者がつきます。あなたたちは、楽しむことに集中できます。
            </p>

            {/* 当日対応リスト */}
            <div className="bg-white rounded-lg p-4 mb-6 space-y-2 text-sm border-2 border-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span className="text-gray-700">開始前の会場確認</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span className="text-gray-700">ベンダー到着・搬入の統括</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span className="text-gray-700">タイムライン進行管理</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span className="text-gray-700">想定外対応</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">✓</span>
                <span className="text-gray-700">撤収・精算確認</span>
              </div>
            </div>

            <button
              onClick={() => scrollToSection('dayof-info')}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all text-sm sm:text-base"
            >
              Day-ofの範囲を見る
            </button>
          </div>
        </div>

        {/* 隠しセクション（スクロール用） */}
        <div id="planboard-demo" className="mt-16 pt-16">
          <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">PlanBoardの画面</h3>
            <p className="text-gray-700 mb-4">
              PlanBoardは、結婚式の全体像を一箇所で管理できるツールです。
            </p>
            <Link
              href="/couple/plan"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all"
            >
              PlanBoardを開く（ログインが必要です）
            </Link>
          </div>
        </div>

        <div id="dayof-info" className="mt-16 pt-16">
          <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Day-of Plannerの範囲</h3>
            <p className="text-gray-700">
              Day-of Plannerは、結婚式当日の進行管理とベンダーコーディネートを担当します。現在、詳細な実装は準備中です。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}