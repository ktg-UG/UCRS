import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations } from "@/../drizzle/schema";

// GET: 予約一覧取得（特定の日付をフィルター）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // クエリパラメータから日付を取得

  try {
    // 型を明示的に指定
    let query = db.select().from(reservations) as any; // 型の推論を避けるために 'any' 型を使用

    // 日付が指定されていれば、その日付でフィルタリング
    if (date) {
      query = query.where(reservations.date, date); // whereで条件を設定
    }

    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    console.error('データベースからの予約データ取得に失敗:', error);
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規予約作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション例（必須項目が揃っているか確認）
    if (!body.date || !body.startTime || !body.endTime || !body.maxMembers) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const result = await db.insert(reservations).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('予約データの作成に失敗:', error);
    return NextResponse.json(
      { error: '予約の作成に失敗しました' },
      { status: 500 }
    );
  }
}