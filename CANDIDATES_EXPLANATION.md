# PlanBoard Candidates（候補ベンダー）の説明

## 1. Candidatesとは何のためにあるのか？

`candidates`（候補ベンダー）は、**PlanBoardで1つのカテゴリに対して複数のベンダーを候補として検討・比較できるようにする**ための機能です。

### 目的：
- ユーザーがベンダーを検索して「候補に追加」したとき、そのベンダーを保存
- Wedding Genieでプランを登録したとき、推奨ベンダーを候補として保存（現在は実装されていない）
- 複数のベンダーを候補として並べて比較検討できる
- どのベンダーが「候補」で、どれが「決定」かを明確に区別

### データ構造：
- データベーステーブル: `plan_board_candidates`
- 1つのスロット（カテゴリ）に対して複数の候補ベンダーを保存可能
- `source`フィールドで「genie」（Wedding Genieから）か「manual」（手動追加）かを区別

## 2. Candidatesがデータベースに記録されている理由

**はい、candidatesはデータベース（`plan_board_candidates`テーブル）に永続的に記録されています。**

### 記録されるタイミング：
1. **手動で候補を追加したとき** (`/api/plan-board/slots/[slotId]/candidates` POST)
   - ベンダー詳細ページから「PlanBoardに追加」をクリック
   - `addCandidate`関数が呼ばれる

2. **Wedding Genieからプランを登録したとき** (現在は実装されていない)
   - コメントによると「genieプラン登録時はcandidatesを登録しない」と記載

### 復活する理由：
- **決定（selected）状態になっても、candidatesテーブルからは自動削除されない**（一部のみ削除）
- 現在の実装では、決定したベンダー（selectedVendorId）だけがcandidatesから削除される
- 他の候補は残り続ける
- Wedding Genieからプランを再登録すると、既存のcandidatesに追加される可能性がある

## 3. Candidatesを消し去ることはできるのか？

**はい、削除は可能です。** ただし、現在の実装では以下の問題があります：

### 現在の削除ロジック：
1. **決定したベンダーだけを削除** (46-53行目)
   ```typescript
   if (data.state === 'selected' && data.selectedVendorId) {
     await prisma.planBoardCandidate.deleteMany({
       where: {
         planBoardSlotId: slotId,
         vendorId: data.selectedVendorId,  // 決定したベンダーのみ削除
       },
     })
   }
   ```

2. **手動で候補を削除** (`removeCandidate`関数)
   - ユーザーが「候補から削除」ボタンをクリック
   - `/api/plan-board/slots/[slotId]/candidates` DELETE

### 問題点：
- **決定したベンダー以外の候補が残り続ける**
- **決定状態になったときに、そのスロットの全てのcandidatesを削除する方が適切かもしれない**

### 改善案：
1. **決定状態になったとき、そのスロットの全てのcandidatesを削除**
   ```typescript
   if (data.state === 'selected') {
     // 決定状態になったら、そのスロットの全ての候補を削除
     await prisma.planBoardCandidate.deleteMany({
       where: {
         planBoardSlotId: slotId,
       },
     })
   }
   ```

2. **「候補から削除」ボタンで個別に削除**（現在の機能を維持）

## 4. 推奨される改善

### オプションA: 決定時に全てのcandidatesを削除（推奨）
- 決定したら候補は不要なので、全て削除する
- UIがシンプルになる
- 過去の候補履歴は残らない

### オプションB: 決定時も候補を残す（現在の実装に近い）
- 決定した後も、過去に検討した候補を見られる
- 比較のために候補を残したい場合に有用
- ただし、UIで「決定済み」と「候補」を明確に区別する必要がある

## 5. 現在の問題の原因

1. **Wedding Genieからの登録時にcandidatesが作成されない**
   - コメントによると「genieプラン登録時はcandidatesを登録しない」と記載されているが、実際には別のロジックで作成されている可能性

2. **決定時に一部のcandidatesだけが削除される**
   - 決定したベンダーのみ削除されるため、他の候補が残る

3. **状態が「candidate」から「selected」に変わったときの処理が不完全**
   - selectedProfileIdの設定が漏れていた（現在は修正済み）
   - candidatesの削除が不完全

## 6. 結論

**Candidatesは「候補を比較検討するため」に存在しますが、決定後は不要になる可能性が高いです。**

推奨される改善：
- **決定（selected）状態になったとき、そのスロットの全てのcandidatesを削除する**
- これにより、決定したカテゴリには候補が表示されなくなり、UIがよりシンプルになります