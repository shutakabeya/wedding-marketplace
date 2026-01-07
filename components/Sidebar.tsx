'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
