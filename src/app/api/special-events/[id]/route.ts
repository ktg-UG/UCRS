import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { specialEvents } from "@/../drizzle/schema";
import { eq } from "drizzle-orm";
import { ReservationEvent } from "@/types";

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
    const data = await db.query.specialEvents.findFirst({
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
    const { startTime, endTime, maxMembers, memberNames, purpose, comment } =
      body;

    const updateData: Partial<ReservationEvent> = {};

    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (maxMembers !== undefined) updateData.maxMembers = maxMembers;
    if (memberNames !== undefined) updateData.memberNames = memberNames;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (comment !== undefined) updateData.comment = comment;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新するデータがありません" },
        { status: 400 }
      );
    }

    const updatedReservations = await db
      .update(specialEvents)
      .set(updateData)
      .where(eq(specialEvents.id, reservationId))
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
      .delete(specialEvents)
      .where(eq(specialEvents.id, reservationId))
      .returning({ deletedId: specialEvents.id });

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
