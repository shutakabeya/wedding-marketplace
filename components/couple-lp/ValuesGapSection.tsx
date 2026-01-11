'use client'

export function ValuesGapSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-br from-pink-100 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
          でも、多くの人はこう思っています。
        </h2>
        
        <div className="mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-pink-600 mb-3 sm:mb-4">
            約9割
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-800 font-medium px-2">
            が「しきたりに縛られず自由でいい」
          </p>
        </div>

        <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed px-2">
          価値観は変わっている。<br className="hidden sm:inline" />
          変わっていないのは、結婚式の&quot;作り方&quot;です。
        </p>
      </div>
    </section>
  )
}