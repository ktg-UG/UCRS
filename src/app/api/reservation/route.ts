//カレンダー用
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations } from "@/../drizzle/schema";

export const dynamic = "force-dynamic";

// GET: 予約一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // クエリパラメータから日付を取得

  try {
    let query = db.select().from(reservations) as any;

    if (date) {
      query = query.where(reservations.date, date);
    }

    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    console.error("データベースからの予約データ取得に失敗:", error);
    return NextResponse.json(
      { error: "予約データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規予約作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーションを強化
    if (
      !body.date ||
      !body.startTime ||
      !body.endTime ||
      !body.maxMembers ||
      !body.purpose ||
      !body.lineUserId // ★lineUserIdの存在をチェック
    ) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const result = await db.insert(reservations).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("予約データの作成に失敗:", error);
    return NextResponse.json(
      { error: "予約の作成に失敗しました" },
      { status: 500 }
    );
  }
}
