'use client'

export function Surprise4Section() {
  const sections = [
    {
      id: 'cheap',
      title: '驚くほど、安い',
      conclusion: '結婚式は、削らなくても安くできます。',
      whyBefore: {
        title: 'なぜ今まで高かったのか',
        content: [
          '多くの結婚式は、',
          '「必要かどうか」ではなく',
          '「最初からセットになっているかどうか」で価格が決まっていました。',
          '',
          '人数が少なくても、会場の基本料金は同じ',
          '使わなくても、演出やオプションが含まれている',
          '選び直すほど、手間と追加費用がかかる',
          '',
          '結果、',
          '平均総額 343.9万円 という数字が"普通"になります。',
        ],
      },
      whatChanged: {
        title: '何を変えたのか',
        content: [
          'Wedding Marketでは、',
          '「最初から「組み立て前提」」で設計します。',
          '',
          '会場',
          '写真',
          'ドレス',
          'ヘアメイク',
          '進行',
          '',
          'すべてを',
          '「要るか・要らないか」',
          '「どこにお金をかけたいか」',
          'から選ぶ。',
        ],
      },
      whatHappens: {
        title: '何が起きるか',
        items: [
          '不要な固定費が消える',
          '「安くするための我慢」が発生しない',
          '削るのではなく、選んだ結果として安い',
        ],
      },
      data: '結婚式の見積は平均 4.4回。\n＝最初から"最適化されていない"。\n最初に整理すれば、後で削る必要はない。',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
    },
    {
      id: 'easy',
      title: '驚くほど、楽',
      conclusion: '結婚式が大変なのは、DIYだからではありません。「考える場所」と「決める順番」がバラバラだからです。',
      whyBefore: {
        title: '今までの"しんどさ"の正体',
        content: [
          '打ち合わせは 2時間 × 5〜6回',
          '',
          '毎回、違う資料',
          '毎回、前提を思い出す',
          '毎回、「これって決めたっけ？」が発生',
          '',
          'だから、',
          '「準備が面倒」で結婚式をやらない人が4人に1人。',
        ],
      },
      whatChanged: {
        title: '何を変えたのか',
        content: [
          'Wedding Marketでは、',
          '',
          '全体像',
          '予算',
          '選択肢',
          '次にやること',
          '',
          'を一箇所にまとめる。',
          '',
          '「今日は何を決める日か」',
          '「もう何が決まっているか」',
          'が、常に分かる。',
        ],
      },
      whatHappens: {
        title: '何が起きるか',
        items: [
          '打ち合わせが"確認"になる',
          '迷う時間が減る',
          '決断疲れが起きない',
        ],
      },
      data: '',
      conclusionNote: '楽になるのは、気合じゃなく設計。',
      bgColor: 'bg-white',
    },
    {
      id: 'transparent',
      title: '驚くほど、透明',
      conclusion: '「いくらかかっているか」が、ずっと分かる結婚式は、安心します。',
      whyBefore: {
        title: 'なぜ不透明になっていたのか',
        content: [
          '見積が"完成形"ではない',
          '後から増える前提の項目がある',
          '',
          '実際、',
          '料理は65.2%のケースで見積UP。',
          '',
          'これは誰かが悪いのではなく、',
          'そう動く設計だっただけ。',
        ],
      },
      whatChanged: {
        title: '何を変えたのか',
        content: [
          'Wedding Marketでは、',
          '',
          'ベンダーごとの金額',
          '合計金額',
          '追加・変更による差分',
          '',
          'が、常に一画面で見えます。',
        ],
      },
      whatHappens: {
        title: '何が起きるか',
        items: [
          '「なんで増えた？」が起きない',
          '説明を聞かなくても理解できる',
          'お金の話がストレスにならない',
        ],
      },
      data: '',
      conclusionNote: '透明さは、安心感そのものです。',
      bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    },
    {
      id: 'free',
      title: '驚くほど、自由',
      conclusion: '「選べる」ことは、結婚式の満足度を一気に上げます。',
      whyBefore: {
        title: 'なぜ自由じゃなかったのか',
        content: [
          '多くの式場では、契約書に',
          '',
          '指定業者',
          '持ち込み制限',
          '持ち込み料',
          '',
          'が明記されています。',
          '',
          '自由じゃないのは、',
          '気分ではなく契約構造。',
        ],
      },
      whatChanged: {
        title: '何を変えたのか',
        content: [
          'Wedding Marketでは、',
          '',
          '会場に縛られない',
          '組み合わせに正解を作らない',
          '「こうしなきゃ」を置かない',
          '',
          '価値観を起点に、形を決める。',
        ],
      },
      whatHappens: {
        title: '何が起きるか',
        items: [
          '「自分たちらしい」が実現する',
          '妥協が減る',
          '終わった後の納得感が違う',
        ],
      },
      data: '',
      bgColor: 'bg-white',
    },
  ]

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            驚くほど◯◯
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            ― 結婚式を&quot;作り直す&quot;と、ここまで変わる ―
          </p>
          <p className="text-base sm:text-lg text-gray-500 mt-4">
            ここは「理屈」ではなく<br />
            &quot;あ、確かにそうだわ&quot; が連続する場所。
          </p>
        </div>

        <div className="space-y-0">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`${section.bgColor} py-12 lg:py-16 ${index !== sections.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <div className="max-w-5xl mx-auto">
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
                  {section.title}
                </h3>

                {/* 結論 */}
                <div className="mb-10 text-center">
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed">
                    {section.conclusion}
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* なぜ今までそうならなかったか */}
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                      {section.whyBefore.title}
                    </h4>
                    <div className="space-y-2 text-base sm:text-lg text-gray-700 leading-relaxed">
                      {section.whyBefore.content.map((line, i) => (
                        <p key={i} className={line.startsWith('「') || line.includes('Wedding Market') ? 'font-semibold' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* 何を変えたか */}
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                      {section.whatChanged.title}
                    </h4>
                    <div className="space-y-2 text-base sm:text-lg text-gray-700 leading-relaxed">
                      {section.whatChanged.content.map((line, i) => (
                        <p key={i} className={line.startsWith('「') || line.includes('Wedding Market') ? 'font-semibold' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 何が起きるか */}
                <div className="mt-10">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">
                    {section.whatHappens.title}
                  </h4>
                  <ul className="space-y-3 max-w-2xl mx-auto">
                    {section.whatHappens.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-gray-700">
                        <span className="text-pink-600 font-bold mt-1">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* データと結論ノート */}
                {(section.data || section.conclusionNote) && (
                  <div className="mt-8 text-center">
                    {section.data && (
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">
                        {section.data.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < section.data.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    )}
                    {section.conclusionNote && (
                      <p className="text-lg sm:text-xl font-semibold text-gray-900">
                        {section.conclusionNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* セクション締め */}
        <div className="mt-12 lg:mt-16 text-center bg-gray-50 rounded-xl p-8 lg:p-12">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed space-y-2">
            <span className="block">安いのは、削ったからじゃない。</span>
            <span className="block">楽なのは、頑張ったからじゃない。</span>
            <span className="block">透明なのは、正直だからじゃない。</span>
            <span className="block">自由なのは、特別だからじゃない。</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-6">
            最初から、そうなるように作っただけ。
          </p>
        </div>
      </div>
    </section>
  )
}