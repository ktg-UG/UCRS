  import { NextRequest, NextResponse } from "next/server";
  import { db } from "@/lib/drizzle";
  import { reservations } from "@/../drizzle/schema";

  // GET: 予約一覧取得
  export async function GET() {
    try {
      const data = await db.select().from(reservations);
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
