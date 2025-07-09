import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { specialEvents } from "@/../drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// DELETE: IDに基づいて特別イベントを削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = Number(params.id);

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
