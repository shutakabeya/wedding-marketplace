# Wedding Genie 算出ロジック詳細

## 予算レンジの扱いについて

### 予算レンジとは

各カテゴリには **3つの予算値** が設定されています：

- **`allocatedMin`**: 下限（最小予算）
- **`allocatedMid`**: 中央値（推奨予算）
- **`allocatedMax`**: 上限（最大予算）

### 予算レンジの決定方法

#### 1. 初期値の設定

各カテゴリの基礎レンジは `lib/wedding-genie-config.ts` で定義されています：

```typescript
写真: { min: 50000, mid: 80000, max: 120000 }
ケータリング: { min: 150000, mid: 300000, max: 450000 }
// ... など
```

#### 2. プランタイプによる調整

**balanced（バランス型）:**
- 全カテゴリ: `min/mid/max` をそのまま使用

**priority（重視反映型）:**
- 重視カテゴリ: `min = max × 0.8`, `mid = max × 0.9`, `max = max`
- その他: `min = min`, `mid = mid × 0.8`, `max = mid`

**budget（節約型）:**
- 重視カテゴリ: `min = mid × 0.7`, `mid = mid`, `max = mid × 1.2`
- その他: `min = min`, `mid = min`, `max = min × 1.2`

#### 3. プロフィールの実際の価格で更新

ベンダー候補が見つかった場合、**プロフィールの実際の価格**でレンジを更新します：

```typescript
if (candidates.length > 0 && candidates[0].actualPrice !== null) {
  const actualPrice = candidates[0].actualPrice
  allocatedMin = actualPrice * 0.9  // 実際の価格の90%
  allocatedMid = actualPrice         // 実際の価格そのまま
  allocatedMax = actualPrice * 1.1   // 実際の価格の110%
}
```

これにより、**設定値ではなく、実際のプロフィール価格が表示**されます。

#### 4. 引き出物の特別処理

引き出物だけは**単価**なので、人数で掛けます：

```typescript
if (category.name === '引き出物') {
  allocatedMin = range.min * guestCount
  allocatedMid = range.mid * guestCount
  allocatedMax = range.max * guestCount
}
```

### 予算レンジの使用箇所

1. **ベンダー候補の検索**: `allocatedMid` を基準に検索
2. **UI表示**: `actualPrice` があればそれを使用、なければ `allocatedMid` を使用
3. **合計計算**: 
   - `totalMin = 会場 × 0.9 + Σ(allocatedMin)`
   - `totalMid = 会場 + Σ(allocatedMid)`
   - `totalMax = 会場 × 1.1 + Σ(allocatedMax)`

### 予算オーバー時の調整

合計が残予算を超えた場合：

1. priority以外のカテゴリを順に `min` に下げる
2. 引き出物の場合は人数を考慮して `min × guestCount` に設定
3. 予算内に収まるまで繰り返す

---

## 複数料金プランへの対応

### 現在の実装

- **会場**: `plans` 配列から最安値プランを選択
- **その他カテゴリ**: 同様に `plans` 配列から最安値プランを選択

### プロフィールの価格決定優先順位

1. **`plans` 配列がある場合**: 最安値プランの `price` を使用
2. **`plans` がない場合**: 
   - `priceMin` と `priceMax` の平均
   - 片方のみならその値
   - どちらもなければ候補から除外（ただし3段階検索で見つかる可能性あり）

### 複数プランの表示

UIでは、プロフィールに複数のプランがある場合、`(Nプラン)` と表示されます。

---

## 保存プランの確認方法

保存したプランは以下のページで確認できます：

**URL**: `/wedding-genie/saved`

このページでは：
- 保存したすべてのプランが一覧表示されます
- 各プランの入力条件（エリア、人数、予算）が表示されます
- 「PlanBoardに登録」ボタンでPlanBoardに登録できます
- 「削除」ボタンでプランを削除できます

---

## 修正内容まとめ

### ①会場の価格推定
- **修正前**: `price × guestCount`（人数で掛けていた）
- **修正後**: `price` をそのまま使用（会場の料金は総額）

### ②プランナー費用
- **修正前**: 先に計算して残予算から引いていた、プランナー系カテゴリを除外していた
- **修正後**: 他のカテゴリと同様に扱う（除外しない、先に計算しない）

### ③引き出物
- **修正前**: 他のカテゴリと同様に扱っていた
- **修正後**: 人数で掛ける（単価なので）

### ④プロフィールの実際の価格
- **修正前**: 設定値（`allocatedMid`）を表示
- **修正後**: プロフィールの実際の価格（`actualPrice`）を優先表示

### ⑤複数料金プラン
- 最安値プランを自動選択
- UIでプラン数を表示 `(Nプラン)`

### ⑥予算レンジ
- `allocatedMin/Mid/Max` の3値で管理
- プロフィールの実際の価格で更新
- 合計計算に使用

### ⑦保存プラン一覧
- `/wedding-genie/saved` ページを作成
- 保存・削除・PlanBoard登録が可能
