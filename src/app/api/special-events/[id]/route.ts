import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { specialEvents } from "@/../drizzle/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
  }

  try {
    const deletedEvent = await db
      .delete(specialEvents)
      .where(eq(specialEvents.id, eventId))
      .returning();

    if (deletedEvent.length === 0) {
      return NextResponse.json(
        { error: "削除対象のイベントが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "イベントを削除しました" });
  } catch (error) {
    console.error("イベントの削除に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
