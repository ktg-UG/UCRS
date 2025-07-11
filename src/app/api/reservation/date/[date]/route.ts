import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';  // eq演算子をインポート

export const dynamic = 'force-dynamic'

//特定の日付に基づく予約データの取得
export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  // URLパラメータから日付を取得
  const { date } = params; 

  if (!date) {
    return NextResponse.json(
      { error: '日付が指定されていません' },
      { status: 400 }
    );
  }

  try {
    const data = await db.query.reservations.findMany({
      where: (reservations, { eq }) => eq(reservations.date, date),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('予約データの取得に失敗:', error);
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
