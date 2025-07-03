// src/app/api/reservation/id/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema";
import { eq, ne, and } from 'drizzle-orm';

// 時刻が15分単位かどうかをチェックするヘルパー関数
const isMultipleOf15Minutes = (time: string): boolean => {
  if (!time || !time.includes(':')) return false;
  const minutes = parseInt(time.split(':')[1], 10);
  return !isNaN(minutes) && minutes % 15 === 0;
};

// GET: 予約詳細の取得（変更なし）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const reservationId = Number(id);

  if (isNaN(reservationId)) {
    return NextResponse.json({ error: '無効なID形式です' }, { status: 400 });
  }

  try {
    const data = await db.query.reservations.findFirst({
      where: (table, { eq }) => eq(table.id, reservationId),
    });

    if (!data) {
      return NextResponse.json({ error: '指定された予約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('予約データの取得に失敗:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PUT: 予約の更新（LINE連携処理を削除）
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const reservationId = Number(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: '無効なID形式です' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { startTime, endTime, purpose, maxMembers, memberNames } = body; 

    // フォームからの編集保存ロジックのみ残す
    if (!startTime || !endTime || !maxMembers || !memberNames || !purpose) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    if (!isMultipleOf15Minutes(startTime) || !isMultipleOf15Minutes(endTime)) {
      return NextResponse.json({ error: '時間は15分単位で指定してください' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: '終了時刻は開始時刻より後に設定してください' }, { status: 400 });
    }

    const originalReservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId), columns: { date: true } });
    if (!originalReservation) {
      return NextResponse.json({ error: '更新対象の予約が見つかりません' }, { status: 404 });
    }
    
    const existingReservations = await db.select().from(reservations).where(and(eq(reservations.date, originalReservation.date), ne(reservations.id, reservationId)));
    const newStart = new Date(`1970-01-01T${startTime}`);
    const newEnd = new Date(`1970-01-01T${endTime}`);
    if (existingReservations.some(e => new Date(`1970-01-01T${e.startTime}`) < newEnd && new Date(`1970-01-01T${e.endTime}`) > newStart)) {
      return NextResponse.json({ error: '指定された時間帯は既に他の予約と重複しています' }, { status: 409 });
    }

    // 送信されたメンバー名がmembersテーブルになければ登録する
    if (Array.isArray(memberNames) && memberNames.length > 0) {
        const newMembers = memberNames.map(name => ({ name: name.trim() })).filter(m => m.name);
        if (newMembers.length > 0) {
            await db.insert(members).values(newMembers).onConflictDoNothing();
        }
    }

    const updatedReservations = await db.update(reservations).set({ startTime, endTime, maxMembers, memberNames, purpose }).where(eq(reservations.id, reservationId)).returning();
    if (updatedReservations.length === 0) {
      return NextResponse.json({ error: '更新対象の予約が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(updatedReservations[0]);

  } catch (error) {
    console.error('予約データの更新に失敗:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: 予約の削除（変更なし）
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const reservationId = Number(id);

  if (isNaN(reservationId)) {
    return NextResponse.json({ error: '無効なID形式です' }, { status: 400 });
  }

  try {
    const deletedReservations = await db.delete(reservations)
      .where(eq(reservations.id, reservationId))
      .returning({ deletedId: reservations.id });

    if (deletedReservations.length === 0) {
      return NextResponse.json({ error: '削除対象の予約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: '予約を削除しました' });

  } catch (error) {
    console.error('予約データの削除に失敗:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}