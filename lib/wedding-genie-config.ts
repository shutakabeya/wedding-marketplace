// Wedding Genie 設定ファイル
// カテゴリ別の予算レンジ（min/mid/max）とプランナー系の費用レンジ

export interface CategoryBudgetRange {
  min: number
  mid: number
  max: number
}

export interface PlannerBudgetRange {
  min: number
  mid: number
  max: number
}

// カテゴリ別の基礎予算レンジ（円）
// カテゴリ名は既存のカテゴリマスタに合わせる
export const CATEGORY_BUDGET_RANGES: Record<string, CategoryBudgetRange> = {
  写真: {
    min: 50000,
    mid: 80000,
    max: 120000,
  },
  ケータリング: {
    min: 150000,
    mid: 300000,
    max: 450000,
  },
  ドレス: {
    min: 50000,
    mid: 80000,
    max: 120000,
  },
  映像: {
    min: 30000,
    mid: 80000,
    max: 150000,
  },
  MC: {
    min: 30000,
    mid: 50000,
    max: 80000,
  },
  引き出物: {
    min: 1500,
    mid: 2500,
    max: 3500,
  },
  ヘアメイク: {
    min: 25000,
    mid: 60000,
    max: 90000,
  },
  装飾: {
    min: 25000,
    mid: 70000,
    max: 100000,
  },
  ケーキ: {
    min: 15000,
    mid: 30000,
    max: 50000,
  },
  デイオブプランナー: {
    min: 30000,
    mid: 50000,
    max: 70000,
  },
  プランナー: {
    min: 50000,
    mid: 70000,
    max: 200000,
  },
}

// プランナー系の費用レンジ（円）
export const PLANNER_BUDGET_RANGES: Record<string, PlannerBudgetRange> = {
  planner: {
    min: 50000,
    mid: 70000,
    max: 200000,
  },
  day_of: {
    min: 30000,
    mid: 50000,
    max: 70000,
  },
  self: {
    min: 0,
    mid: 0,
    max: 0,
  },
  undecided: {
    min: 50000,
    mid: 80000,
    max: 70000,
  },
}

// 会場の予算比率の理想レンジ
export const VENUE_BUDGET_RATIO = {
  idealMin: 0.35,
  idealMax: 0.50,
  idealCenter: 0.42,
}

// 会場候補の最大数
export const VENUE_CANDIDATE_LIMIT = 7

// 各カテゴリのベンダー候補数（表示用）
export const VENDOR_CANDIDATE_DISPLAY_COUNT = 1
// 各カテゴリのベンダー候補数（内部保持用）
export const VENDOR_CANDIDATE_INTERNAL_COUNT = 5
