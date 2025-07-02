# UCRS (Unite Court Reserve) テニスサークルUnite専用コート予約システム

UCRS (Unite Court Reserve) は、コート予約を管理するためのウェブアプリケーションです。カレンダー形式で予約状況を視覚的に確認し、新しい予約の作成、既存の予約の編集、削除ができます。

以下のURLから誰でもアクセスすることができます。
https://ucrs-git-main-ktg-ugs-projects.vercel.app/?_vercel_share=30lMXNCc3IqnC3WVb3pMi5Drpoce3lhg

ユーザのほとんどがスマホで利用することを想定していますが、PCでもご利用いただけます。

## 主な機能

* **カレンダー表示**: FullCalendar を使用して、月単位で予約状況をカレンダーに表示します。予約は目的（プライベート、練習、試合、レッスン）や参加人数に応じて色分けされます。
* **予約詳細**: 日付をクリックすると、その日の予約詳細が画面下部のボトムシートに表示されます。
* **予約作成**:
    * 日付と時刻（15分単位）を指定して新しい予約を作成できます。
    * プライベート予約とメンバー募集の2種類の予約が可能です。
    * メンバー募集の場合、定員、参加メンバー、目的（練習、試合、レッスン）を設定できます。
    * 新しいメンバー名は自動的にメンバーリストに登録されます。/route.ts]
* **予約編集・削除**:
    * 既存の予約情報を編集できます。/page.tsx, ktg-ug/ucrs/UCRS-4d1f47117fe56774d85aac823ab0ed55a77ab337/src/app/api/reservation/id/[id]/route.ts]
    * 不要になった予約は削除できます。/page.tsx, ktg-ug/ucrs/UCRS-4d1f47117fe56774d85aac823ab0ed55a77ab337/src/app/api/reservation/id/[id]/route.ts, ktg-ug/ucrs/UCRS-4d1f47117fe56774d85aac823ab0ed55a77ab337/src/components/BottomSheet.tsx]
* **メンバー管理**:
    * 参加メンバーは過去の入力履歴からオートコンプリートで選択できます。
    * メンバー名はデータベースで一元管理されます。

## 技術スタック

* **フレームワーク**: Next.js
* **言語**: TypeScript
* **UI**:
    * React
    * Material-UI (MUI)
    * FullCalendar
* **データベース**: Supabase,PostgreSQL
* **デプロイ**: Vercel
* **ORM**: Drizzle ORM
* **Linter**: ESLint

## セットアップと実行方法

1.  **リポジトリのクローン:**

    ```bash
    git clone [https://github.com/ktg-ug/ucrs.git](https://github.com/ktg-ug/ucrs.git)
    cd ucrs
    ```

2.  **依存関係のインストール:**

    ```bash
    npm install
    ```
   

3.  **.env ファイルの作成:**

    ルートディレクトリに `.env` ファイルを作成し、データベースのURLを設定します。

    ```
    DATABASE_URL="your_postgresql_database_url"
    ```

4.  **データベースのマイグレーション:**

    Drizzle ORM を使用してデータベースのスキーマを適用します。

    ```bash
    npx drizzle-kit migrate
    ```

5.  **開発サーバーの起動:**

    ```bash
    npm run dev
    ```
   

    ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、アプリケーションが表示されます。

## データベーススキーマ

このアプリケーションは、`reservations` と `members` の2つのテーブルを使用します。

### `reservations` テーブル

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| `id` | `serial` | 予約ID (主キー) |
| `date` | `date` | 予約日 |
| `start_time` | `time` | 開始時刻 |
| `end_time` | `time` | 終了時刻 |
| `max_members` | `integer` | 最大参加人数 |
| `member_names` | `jsonb` | 参加メンバー名の配列 (例: `["Alice", "Bob"]`) |
| `purpose` | `text` | 予約の目的（プライベート、練習など） |


## API エンドポイント

| HTTP メソッド | エンドポイント | 説明 |
| --- | --- | --- |
| `GET` | `/api/reservation` | すべての予約情報を取得します。 |
| `GET` | `/api/reservation/date/{date}` | 指定された日付の予約情報を取得します。/route.ts] |
| `POST` | `/api/reservation` | 新しい予約を作成します。 |
| `GET` | `/api/reservation/id/{id}` | 指定されたIDの予約詳細を取得します。/route.ts] |
| `PUT` | `/api/reservation/id/{id}` | 指定されたIDの予約情報を更新します。/route.ts] |
| `DELETE` | `/api/reservation/id/{id}` | 指定されたIDの予約を削除します。/route.ts] |
| `GET` | `/api/members` | すべてのメンバー名を取得します。 |
