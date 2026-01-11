// エリアマスタ（都道府県）
export const AREAS = [
  { id: 'hokkaido', name: '北海道' },
  { id: 'aomori', name: '青森県' },
  { id: 'iwate', name: '岩手県' },
  { id: 'miyagi', name: '宮城県' },
  { id: 'akita', name: '秋田県' },
  { id: 'yamagata', name: '山形県' },
  { id: 'fukushima', name: '福島県' },
  { id: 'ibaraki', name: '茨城県' },
  { id: 'tochigi', name: '栃木県' },
  { id: 'gunma', name: '群馬県' },
  { id: 'saitama', name: '埼玉県' },
  { id: 'chiba', name: '千葉県' },
  { id: 'tokyo', name: '東京都' },
  { id: 'kanagawa', name: '神奈川県' },
  { id: 'niigata', name: '新潟県' },
  { id: 'toyama', name: '富山県' },
  { id: 'ishikawa', name: '石川県' },
  { id: 'fukui', name: '福井県' },
  { id: 'yamanashi', name: '山梨県' },
  { id: 'nagano', name: '長野県' },
  { id: 'gifu', name: '岐阜県' },
  { id: 'shizuoka', name: '静岡県' },
  { id: 'aichi', name: '愛知県' },
  { id: 'mie', name: '三重県' },
  { id: 'shiga', name: '滋賀県' },
  { id: 'kyoto', name: '京都府' },
  { id: 'osaka', name: '大阪府' },
  { id: 'hyogo', name: '兵庫県' },
  { id: 'nara', name: '奈良県' },
  { id: 'wakayama', name: '和歌山県' },
  { id: 'tottori', name: '鳥取県' },
  { id: 'shimane', name: '島根県' },
  { id: 'okayama', name: '岡山県' },
  { id: 'hiroshima', name: '広島県' },
  { id: 'yamaguchi', name: '山口県' },
  { id: 'tokushima', name: '徳島県' },
  { id: 'kagawa', name: '香川県' },
  { id: 'ehime', name: '愛媛県' },
  { id: 'kochi', name: '高知県' },
  { id: 'fukuoka', name: '福岡県' },
  { id: 'saga', name: '佐賀県' },
  { id: 'nagasaki', name: '長崎県' },
  { id: 'kumamoto', name: '熊本県' },
  { id: 'oita', name: '大分県' },
  { id: 'miyazaki', name: '宮崎県' },
  { id: 'kagoshima', name: '鹿児島県' },
  { id: 'okinawa', name: '沖縄県' },
] as const

// エリアグループ（地域）
export const AREA_GROUPS = [
  {
    id: 'zenkoku',
    name: '全国',
    areaIds: AREAS.map((a) => a.id), // すべての都道府県を含む
  },
  {
    id: 'kanto',
    name: '関東',
    areaIds: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  },
  {
    id: 'kansai',
    name: '関西',
    areaIds: ['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    id: 'chubu',
    name: '中部',
    areaIds: ['niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi'],
  },
  {
    id: 'chugoku',
    name: '中国',
    areaIds: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  {
    id: 'shikoku',
    name: '四国',
    areaIds: ['tokushima', 'kagawa', 'ehime', 'kochi'],
  },
  {
    id: 'kyushu',
    name: '九州',
    areaIds: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'],
  },
  {
    id: 'tohoku',
    name: '東北',
    areaIds: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    id: 'hokkaido',
    name: '北海道',
    areaIds: ['hokkaido'],
  },
] as const

// エリアIDからエリア名を取得
export function getAreaName(areaId: string): string | undefined {
  return AREAS.find((a) => a.id === areaId)?.name
}

// エリアグループIDからグループ名を取得
export function getAreaGroupName(groupId: string): string | undefined {
  return AREA_GROUPS.find((g) => g.id === groupId)?.name
}

// エリアIDまたはグループIDから、実際に含まれるすべてのエリアIDを展開
export function expandAreaIds(areaOrGroupIds: string[]): string[] {
  const expanded: string[] = []
  
  for (const id of areaOrGroupIds) {
    // グループの場合
    const group = AREA_GROUPS.find((g) => g.id === id)
    if (group) {
      expanded.push(...group.areaIds)
    } else {
      // 個別エリアの場合
      const area = AREAS.find((a) => a.id === id)
      if (area) {
        expanded.push(area.id)
      }
    }
  }
  
  // 重複を削除
  return Array.from(new Set(expanded))
}

// 検索用：指定されたエリアID（またはグループID）で検索する際に、マッチする可能性のあるすべてのエリアID/グループIDを返す
// 例: 'chiba' を検索 → ['chiba', 'kanto', 'zenkoku'] を返す
// 例: 'kanto' を検索 → ['kanto', 'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'] を返す
// 例: 'zenkoku' を検索 → ['zenkoku'] + すべての個別エリアID を返す
export function getMatchingAreaIds(searchAreaId: string): string[] {
  const matching: string[] = [searchAreaId] // 自分自身
  
  // グループIDかどうかを確認
  const group = AREA_GROUPS.find((g) => g.id === searchAreaId)
  if (group) {
    // グループIDの場合は、そのグループに含まれるすべての個別エリアIDも返す
    matching.push(...group.areaIds)
    return matching
  }
  
  // 個別エリアIDの場合は、このエリアを含むグループを探す
  for (const g of AREA_GROUPS) {
    if ((g.areaIds as readonly string[]).includes(searchAreaId)) {
      matching.push(g.id)
    }
  }
  
  return matching
}

// すべての選択可能なエリアとグループを統合したリスト（表示用）
export const ALL_SELECTABLE_AREAS = [
  // まずグループ
  ...AREA_GROUPS.map((g) => ({
    id: g.id,
    name: g.name,
    type: 'group' as const,
  })),
  // 次に個別エリア
  ...AREAS.map((a) => ({
    id: a.id,
    name: a.name,
    type: 'area' as const,
  })),
]

// エリアIDまたはグループIDから表示名を取得
export function getDisplayName(id: string): string {
  return getAreaGroupName(id) || getAreaName(id) || id
}

// 表示名（日本語）からエリアIDまたはグループIDを取得
export function getIdFromDisplayName(displayName: string): string | undefined {
  // グループから検索
  const group = AREA_GROUPS.find((g) => g.name === displayName)
  if (group) {
    return group.id
  }
  // 個別エリアから検索
  const area = AREAS.find((a) => a.name === displayName)
  if (area) {
    return area.id
  }
  return undefined
}

// 検索用：ベンダープロフィールのエリア配列が、検索エリアとマッチするかどうかを判定
// 例: プロフィールのエリアが ['zenkoku']（全国）の場合、'chiba' で検索してもマッチする
// 例: プロフィールのエリアが ['kanto']（関東）の場合、'chiba' で検索するとマッチする
export function isAreaMatching(profileAreas: string[], searchAreaId: string): boolean {
  // プロフィールのエリアを展開（グループIDを個別エリアIDに変換）
  const expandedProfileAreas = expandAreaIds(profileAreas)
  
  // 検索エリアのマッチングIDを取得（例: 'chiba' → ['chiba', 'kanto', 'zenkoku']）
  const matchingSearchAreaIds = getMatchingAreaIds(searchAreaId)
  
  // 展開されたプロフィールエリアの中に、検索エリアのマッチングIDが含まれているかチェック
  // または、プロフィールエリアが「全国」を含んでいる場合は常にマッチ
  if (profileAreas.includes('zenkoku')) {
    return true // 全国を選択している場合はすべてのエリアにマッチ
  }
  
  // 展開されたプロフィールエリアの中に、検索エリア（またはそのグループ）が含まれているか
  for (const searchAreaIdItem of matchingSearchAreaIds) {
    if (expandedProfileAreas.includes(searchAreaIdItem)) {
      return true
    }
    // プロフィールエリアの中に検索エリアを含むグループがあるかチェック
    const searchExpanded = expandAreaIds([searchAreaIdItem])
    for (const profileArea of profileAreas) {
      const profileExpanded = expandAreaIds([profileArea])
      if (profileExpanded.some(pe => searchExpanded.includes(pe))) {
        return true
      }
    }
  }
  
  // 既存データ（日本語の都道府県名）との互換性：表示名で比較
  const searchDisplayName = getDisplayName(searchAreaId)
  if (profileAreas.includes(searchDisplayName) || profileAreas.includes(searchAreaId)) {
    return true
  }
  
  return false
}