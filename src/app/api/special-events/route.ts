import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { specialEvents } from "@/../drizzle/schema";

export const dynamic = "force-dynamic";

// GET: すべての特別イベントを取得
export async function GET() {
  try {
    const data = await db.select().from(specialEvents);
    return NextResponse.json(data);
  } catch (error) {
    console.error("特別イベントの取得に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// POST: 新しい特別イベントを作成
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, date, eventName, memo } = body;

    // バリデーション
    if (!type || !date) {
      return NextResponse.json(
        { error: "タイプと日付は必須です。" },
        { status: 400 }
      );
    }
    if (type === "event" && !eventName) {
      return NextResponse.json(
        { error: "イベント名を入力してください。" },
        { status: 400 }
      );
    }

    const newEvent = await db
      .insert(specialEvents)
      .values({
        type,
        date,
        eventName,
        memo,
      })
      .returning();

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("特別イベントの作成に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
