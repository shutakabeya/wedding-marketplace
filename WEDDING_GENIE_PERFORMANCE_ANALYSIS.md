# WeddingGenie パフォーマンス問題の分析

## 問題の概要

WeddingGenieでプランを構築するのが非常に遅い原因を分析しました。

## 主な問題点

### 1. **N+1クエリ問題（最大の問題）**

**問題箇所**: `calculateCategoryAllocations`関数内（287行目）

```typescript
for (const category of targetCategories) {
  // ...
  const candidates = await getVendorCandidates(category.id, input.area, searchBudget, input.guestCount, isGift)
  // ...
}
```

**影響**:
- カテゴリ数が約11個（会場を除く）の場合、**各カテゴリごとにデータベースクエリが実行される**
- 1つのプランタイプ生成で**11回のクエリ**が発生
- 3つのプランタイプ（balanced, priority, budget）を生成するため、**合計33回のクエリ**が発生

**計算例**:
- カテゴリ数: 11個
- プランタイプ数: 3個
- **合計クエリ数: 11 × 3 = 33回**

### 2. **3段階のフォールバッククエリ**

**問題箇所**: `getVendorCandidates`関数内（361-518行目）

```typescript
// 1. 厳密な条件で検索
let profiles = await prisma.vendorProfile.findMany({ ... })

// 2. 見つからない場合、予算条件を緩和
if (profiles.length === 0) {
  profiles = await prisma.vendorProfile.findMany({ ... })
}

// 3. それでも見つからない場合、エリア条件も緩和
if (profiles.length === 0) {
  profiles = await prisma.vendorProfile.findMany({ ... })
}
```

**影響**:
- 最悪の場合、1カテゴリあたり**3回のクエリ**が実行される可能性
- 見つからないカテゴリが多い場合、**33 × 3 = 99回のクエリ**が発生する可能性

### 3. **カテゴリ取得の重複**

**問題箇所**: `calculateCategoryAllocations`関数内（201行目）

```typescript
const allCategories = await prisma.category.findMany({
  where: {
    name: { not: '会場' },
  },
})
```

**影響**:
- 3つのプランタイプごとに同じクエリが実行される
- **3回の重複クエリ**が発生

### 4. **順次処理による遅延**

**問題箇所**: `generatePlans`関数内（595行目）

```typescript
for (const planType of ['balanced', 'priority', 'budget'] as const) {
  const { allocations, vendorCandidates: categoryVendors } =
    await calculateCategoryAllocations(input, venueEstimatedPrice, dummyPlannerCost, planType)
  // ...
}
```

**影響**:
- 3つのプランタイプを順次処理しているため、並列化できない
- 各プランタイプの処理が完了するまで次の処理が開始されない

## パフォーマンス影響の試算

### 現在の実装

**最良の場合**:
- カテゴリ取得: 3回（重複）
- ベンダー候補取得: 33回（11カテゴリ × 3プランタイプ）
- **合計: 36回のクエリ**

**最悪の場合**:
- カテゴリ取得: 3回（重複）
- ベンダー候補取得: 99回（11カテゴリ × 3プランタイプ × 3段階フォールバック）
- **合計: 102回のクエリ**

### クエリ実行時間の仮定

- 1回のクエリあたり平均100msと仮定
- **最良の場合**: 36 × 100ms = **3.6秒**
- **最悪の場合**: 102 × 100ms = **10.2秒**

実際にはネットワーク遅延やデータベースの負荷により、さらに遅くなる可能性があります。

## 推奨される改善策

### 1. **バッチクエリ化（最優先）**

すべてのカテゴリのベンダー候補を1回のクエリで取得するように変更：

```typescript
// すべてのカテゴリのベンダー候補を一度に取得
const allVendorCandidates = await getVendorCandidatesBatch(
  targetCategories.map(c => c.id),
  input.area,
  // ...
)
```

**効果**: 33回のクエリ → **1回のクエリ**に削減

### 2. **カテゴリ取得のキャッシュ**

カテゴリ一覧はプランタイプ間で共通なので、1回だけ取得：

```typescript
// generatePlans関数の最初で1回だけ取得
const allCategories = await prisma.category.findMany({ ... })

// calculateCategoryAllocationsに引数として渡す
```

**効果**: 3回のクエリ → **1回のクエリ**に削減

### 3. **並列処理の導入**

3つのプランタイプを並列に処理：

```typescript
const [balanced, priority, budget] = await Promise.all([
  calculateCategoryAllocations(input, venueEstimatedPrice, dummyPlannerCost, 'balanced'),
  calculateCategoryAllocations(input, venueEstimatedPrice, dummyPlannerCost, 'priority'),
  calculateCategoryAllocations(input, venueEstimatedPrice, dummyPlannerCost, 'budget'),
])
```

**効果**: 順次処理の時間を**約1/3に短縮**

### 4. **フォールバッククエリの最適化**

3段階のフォールバックを1つのクエリに統合：

```typescript
// OR条件で一度に検索
const profiles = await prisma.vendorProfile.findMany({
  where: {
    OR: [
      // 厳密な条件
      { ... },
      // 予算緩和条件
      { ... },
      // エリア緩和条件
      { ... },
    ],
  },
  // 優先度順にソート
  orderBy: [ ... ],
})
```

**効果**: 最悪の場合でも1カテゴリあたり**1回のクエリ**に削減

## 改善後の期待パフォーマンス

### 最良の場合
- カテゴリ取得: 1回
- ベンダー候補取得: 1回（バッチ）
- **合計: 2回のクエリ**
- **実行時間: 約0.2秒**（100ms × 2）

### 最悪の場合
- カテゴリ取得: 1回
- ベンダー候補取得: 1回（バッチ、統合フォールバック）
- **合計: 2回のクエリ**
- **実行時間: 約0.2秒**（100ms × 2）

**改善効果**: **約18倍〜51倍の高速化**が期待できます。

## 実装の優先順位

1. **最優先**: バッチクエリ化（N+1問題の解決）
2. **高優先**: カテゴリ取得のキャッシュ
3. **中優先**: 並列処理の導入
4. **低優先**: フォールバッククエリの最適化（バッチ化で解決される可能性あり）
