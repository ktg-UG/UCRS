import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { specialEvents } from "@/../drizzle/schema"; // 正しいテーブルをインポート
import { eq } from "drizzle-orm";
import { SpecialEvent } from "@/types"; // 正しい型をインポート

export const dynamic = "force-dynamic";

// GET: 特別イベント詳細の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const data = await db.query.specialEvents.findFirst({
      where: (table, { eq }) => eq(table.id, eventId),
    });

    if (!data) {
      return NextResponse.json(
        { error: "指定されたイベントが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("特別イベントデータの取得に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT: 特別イベントの更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { type, date, eventName, memo } = body;

    const updateData: Partial<SpecialEvent> = {};

    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (eventName !== undefined) updateData.eventName = eventName;
    if (memo !== undefined) updateData.memo = memo;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新するデータがありません" },
        { status: 400 }
      );
    }

    const updatedEvents = await db
      .update(specialEvents)
      .set(updateData)
      .where(eq(specialEvents.id, eventId))
      .returning();

    if (updatedEvents.length === 0) {
      return NextResponse.json(
        { error: "更新対象のイベントが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEvents[0]);
  } catch (error) {
    console.error("特別イベントデータの更新に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// DELETE: 特別イベントの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const deletedEvents = await db
      .delete(specialEvents)
      .where(eq(specialEvents.id, eventId))
      .returning({ deletedId: specialEvents.id });

    if (deletedEvents.length === 0) {
      return NextResponse.json(
        { error: "削除対象のイベントが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "イベントを削除しました" });
  } catch (error) {
    console.error("特別イベントの削除に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
