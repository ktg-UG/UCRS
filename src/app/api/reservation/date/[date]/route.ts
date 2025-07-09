import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";  // drizzle DB接続
import { reservations } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';  // eq演算子をインポート

export const dynamic = 'force-dynamic'

// GET: 特定の日付に基づく予約データの取得
export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  const { date } = params; // URLパラメータから日付を取得

  if (!date) {
    return NextResponse.json(
      { error: '日付が指定されていません' },
      { status: 400 }
    );
  }

  try {
    // where句でeq演算子を使ってdateをフィルタリング
    const data = await db.query.reservations.findMany({
      where: (reservations, { eq }) => eq(reservations.date, date),  // dateフィルタリング
    });

    // データが存在しない場合でもエラーを返さず、空の配列を返す
    return NextResponse.json(data); // 取得した予約データを返す
  } catch (error) {
    console.error('予約データの取得に失敗:', error);
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
