'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="メニューを閉じる"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* メニュー項目 */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {/* カップル向けガイド */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-4 border border-pink-200">
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-pink-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    カップル向けガイド
                  </h3>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {guideOpen && (
                  <div className="mt-3 space-y-3 text-xs text-gray-700">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">1. ベンダーを探す</h4>
                      <p className="leading-relaxed">
                        トップページのカテゴリから、会場・写真・ドレスなど必要なベンダーを探します。気になるベンダーがあれば詳細ページで詳しく確認しましょう。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">2. 問い合わせを送る</h4>
                      <p className="leading-relaxed">
                        ベンダーの詳細ページから問い合わせフォームで、結婚式の希望日・エリア・人数・予算などを伝えます。複数のベンダーに問い合わせて比較検討できます。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">3. PlanBoardで組み立てる</h4>
                      <p className="leading-relaxed">
                        PlanBoardでは、選んだベンダーをカテゴリごとに配置して、結婚式の全体像を視覚的に組み立てられます。各スロットに候補を追加し、最適な組み合わせを見つけましょう。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">4. メッセージでやり取り</h4>
                      <p className="leading-relaxed">
                        「問い合わせ一覧」から各ベンダーとのメッセージを確認し、詳細な打ち合わせを進めます。質問や要望を伝えて、理想の結婚式を実現しましょう。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                機能
              </div>
              <Link
                href="/couple/plan"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors font-medium"
              >
                PlanBoard
              </Link>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-6">
                ログイン
              </div>
              <Link
                href="/couple/login"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                カップルログイン
              </Link>
              <Link
                href="/vendor/login"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                ベンダーログイン
              </Link>
              <Link
                href="/admin/login"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                管理者ログイン
              </Link>
            </div>
          </nav>
        </div>
      </aside>
    </>
  )
}
