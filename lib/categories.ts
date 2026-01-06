// カテゴリマスタ（初期データ）
export const CATEGORIES = [
  { name: '会場', displayOrder: 1 },
  { name: '写真', displayOrder: 2 },
  { name: 'ケータリング', displayOrder: 3 },
  { name: 'ドレス', displayOrder: 4 },
  { name: '引き出物', displayOrder: 5 },
  { name: 'ヘアメイク', displayOrder: 6 },
  { name: 'デイオブプランナー', displayOrder: 7 },
  { name: 'ケーキ', displayOrder: 8 },
  { name: 'スタッフ', displayOrder: 9 },
  { name: 'プランナー', displayOrder: 10 },
  { name: 'MC', displayOrder: 11 },
  { name: '映像', displayOrder: 12 },
] as const

export type CategoryName = typeof CATEGORIES[number]['name']
