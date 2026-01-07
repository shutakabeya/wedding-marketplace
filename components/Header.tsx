'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <header className="sticky top-0 z-50 bg-white/95 shadow-lg backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center relative">
            {/* ハンバーガーメニューボタン */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-pink-50 rounded-lg transition-all hover:scale-110 mr-4"
              aria-label="メニューを開く"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* 中央に配置されたタイトル */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform inline-block">
                wedding market
              </Link>
            </div>

            {/* 右側の人アイコンボタン */}
            <Link
              href="/couple/login"
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-pink-50 rounded-lg transition-all hover:scale-110"
              aria-label="カップルログイン"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
