import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations } from "@/../drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET: 予約詳細の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const reservationId = Number(id);

  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const data = await db.query.reservations.findFirst({
      where: (table, { eq }) => eq(table.id, reservationId),
    });

    if (!data) {
      return NextResponse.json(
        { error: "指定された予約が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("予約データの取得に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT: 予約の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const reservationId = Number(id);

  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const updatedReservations = await db
      .update(reservations)
      .set({
        startTime: body.startTime,
        endTime: body.endTime,
        maxMembers: body.maxMembers,
        memberNames: body.memberNames,
        purpose: body.purpose,
        comment: body.comment,
      })
      .where(eq(reservations.id, reservationId))
      .returning();

    if (updatedReservations.length === 0) {
      return NextResponse.json(
        { error: "更新対象の予約が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedReservations[0]);
  } catch (error) {
    console.error("予約データの更新に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// DELETE: 予約の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const reservationId = Number(id);

  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "無効なID形式です" }, { status: 400 });
  }

  try {
    const deletedReservations = await db
      .delete(reservations)
      .where(eq(reservations.id, reservationId))
      .returning({ deletedId: reservations.id });

    if (deletedReservations.length === 0) {
      return NextResponse.json(
        { error: "削除対象の予約が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "予約を削除しました" });
  } catch (error) {
    console.error("予約データの削除に失敗:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
