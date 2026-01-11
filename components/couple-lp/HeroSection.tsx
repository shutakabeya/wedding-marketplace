'use client'

export function HeroSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* 左：コピー */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              信じられないほど、<br />
              ちゃんとした結婚式を。
            </h1>
            
            <div className="space-y-2 sm:space-y-3 text-lg sm:text-xl md:text-2xl text-gray-800 font-medium">
              <p>驚くほど安く。</p>
              <p>驚くほど楽に。</p>
              <p>驚くほど透明で。</p>
              <p>驚くほど自由に。</p>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-xl">
              「高い・面倒・不透明・縛られる」<br className="hidden sm:inline" />
              <span className="sm:hidden">それ、結婚式の仕様だと思い込んでいませんか？</span>
              <span className="hidden sm:inline">それ、結婚式の仕様だと思い込んでいませんか？</span>
            </p>
          </div>

          {/* 右：数字バッジ＋矛盾の一言 */}
          <div className="space-y-6 sm:space-y-8 mt-8 lg:mt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-5 shadow-md border-2 border-gray-200">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  343.9万円
                </div>
                <div className="text-xs sm:text-sm text-gray-700">
                  平均総額
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-5 shadow-md border-2 border-gray-200">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  4.4回
                </div>
                <div className="text-xs sm:text-sm text-gray-700">
                  見積平均
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-5 shadow-md border-2 border-gray-200">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  65.2%
                </div>
                <div className="text-xs sm:text-sm text-gray-700">
                  料理が見積UP
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-5 shadow-md border-2 border-gray-200">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  4人に1人
                </div>
                <div className="text-xs sm:text-sm text-gray-700">
                  準備が面倒でやらない
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-gray-700 text-center leading-relaxed">
              結婚式が&quot;微妙化しやすい&quot;のは、あなたのせいじゃない。<br className="hidden sm:inline" />
              構造です。
            </p>
          </div>
        </div>

        {/* CTA（2つ） */}
        <div className="mt-8 sm:mt-12 lg:mt-16 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          <button
            onClick={() => scrollToSection('structure')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm sm:text-base md:text-lg"
          >
            結婚式が微妙化する理由を見る
          </button>
          <button
            onClick={() => scrollToSection('tools')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base md:text-lg"
          >
            作り直す仕組みを見る
          </button>
        </div>
      </div>
    </section>
  )
}