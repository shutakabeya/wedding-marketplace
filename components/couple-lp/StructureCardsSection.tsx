'use client'

export function StructureCardsSection() {
  const cards = [
    {
      title: '高くなりやすい',
      number: '平均総額 343.9万円',
      supplement: 'さらに、見積は平均 4.4回やり取りされます',
      highlight: '最初の金額が完成形じゃない',
      description: '途中で増える余地が多いほど、最後に「こんなはずじゃ…」が起きやすい',
    },
    {
      title: '不透明になりやすい',
      number: '料理は 65.2%が見積UP',
      supplement: '',
      highlight: '「上がる」前提の項目がある',
      description: '後からの調整が多いほど、内訳は分かりにくくなります',
    },
    {
      title: '縛られやすい',
      number: '規約に明記されがち',
      supplement: '指定業者／持ち込み制限／持ち込み料',
      highlight: '「選べない」は気分ではなく契約構造',
      description: '自由度が低いほど、納得感は落ちやすい',
    },
    {
      title: '面倒になりやすい',
      number: '打ち合わせ 2時間×5〜6回が一般的',
      supplement: '「準備が面倒」で結婚式をしない人 4人に1人',
      highlight: 'コミュニケーションが、煩雑すぎる',
      description: '面倒さはやり方で減らせます',
    },
  ]

  return (
    <section id="structure" className="py-8 sm:py-12 md:py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            なぜ、結婚式は&quot;微妙&quot;になりやすいのか。
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed px-2">
            結婚式は大きな買い物で、工程も長い。<br className="hidden sm:inline" />
            そのうえ「価格」「自由」「調整」「責任」がズレやすい設計になっています。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 border-2 border-gray-300 hover:shadow-lg transition-shadow"
            >
              <div className="mb-3 sm:mb-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {card.number}
                </div>
                {card.supplement && (
                  <div className="text-xs sm:text-sm text-gray-700 mb-3">
                    {card.supplement}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                {card.title}
              </h3>
              
              <p className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                {card.highlight}
              </p>
              
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 lg:mt-16 text-center px-2">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-relaxed">
            結婚式が微妙化するのは、あなたが下手だからじゃない。<br className="hidden sm:inline" />
            そうなりやすい構造があるだけ。
          </p>
        </div>
      </div>
    </section>
  )
}