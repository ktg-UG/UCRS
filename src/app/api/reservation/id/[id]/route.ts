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

// GET: 予約詳細の取得
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

// PUT: 予約の更新と参加処理
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const reservationId = Number(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: '無効なID形式です' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // actionキーで処理を分岐させる
    const { action, lineUserId, lineUserName, ...reservationData } = body;

    // LIFFからの参加アクションの場合
    if (action === 'join') {
        if (!lineUserId || !lineUserName) {
            return NextResponse.json({ error: 'LINEユーザー情報が不足しています' }, { status: 400 });
        }

        const existingReservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
        if (!existingReservation) {
            return NextResponse.json({ error: '指定された予約が見つかりません' }, { status: 404 });
        }

        if (existingReservation.memberNames.includes(lineUserName)) {
            return NextResponse.json({ message: '既に参加済みです' }, { status: 200 });
        }
        if (existingReservation.maxMembers && existingReservation.memberNames.length >= existingReservation.maxMembers) {
            return NextResponse.json({ error: '定員に達しているため参加できません' }, { status: 409 });
        }

        const updatedMemberNames = [...existingReservation.memberNames, lineUserName];

        // membersテーブルにLINEユーザー情報を登録または更新(UPSERT)
        await db.insert(members)
            .values({ name: lineUserName, lineUserId: lineUserId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: lineUserName } });

        // reservationsテーブルの参加者リストを更新
        const [updatedReservation] = await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId))
            .returning();

        return NextResponse.json(updatedReservation);
    }
    
    // 従来のフォームからの編集保存ロジック
    const { startTime, endTime, purpose, maxMembers, memberNames } = reservationData;
    if (!startTime || !endTime || maxMembers === undefined || !memberNames || !purpose) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    if (!isMultipleOf15Minutes(startTime) || !isMultipleOf15Minutes(endTime)) {
      return NextResponse.json({ error: '時間は15分単位で指定してください' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: '終了時刻は開始時刻より後に設定してください' }, { status: 400 });
    }

    const reservationToUpdate = await db.query.reservations.findFirst({
        where: eq(reservations.id, reservationId),
    });
    if (!reservationToUpdate) {
        return NextResponse.json({ error: '更新対象の予約が見つかりません' }, { status: 404 });
    }
    if (memberNames.length > maxMembers) {
        return NextResponse.json({ error: `定員(${maxMembers}人)を超えています。` }, { status: 409 });
    }
    
    const existingReservationsOnDate = await db.select().from(reservations).where(and(eq(reservations.date, reservationToUpdate.date), ne(reservations.id, reservationId)));
    const newStart = new Date(`1970-01-01T${startTime}`);
    const newEnd = new Date(`1970-01-01T${endTime}`);
    if (existingReservationsOnDate.some(e => new Date(`1970-01-01T${e.startTime}`) < newEnd && new Date(`1970-01-01T${e.endTime}`) > newStart)) {
      return NextResponse.json({ error: '指定された時間帯は既に他の予約と重複しています' }, { status: 409 });
    }

    if (Array.isArray(memberNames) && memberNames.length > 0) {
        const newMembers = memberNames.map(name => ({ name: name.trim() })).filter(m => m.name.length > 0);
        if (newMembers.length > 0) {
            await db.insert(members).values(newMembers).onConflictDoNothing();
        }
    }

    const [updatedReservation] = await db.update(reservations).set({ startTime, endTime, maxMembers, memberNames, purpose }).where(eq(reservations.id, reservationId)).returning();
    if (!updatedReservation) {
      return NextResponse.json({ error: '更新対象の予約が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(updatedReservation);

  } catch (error) {
    console.error('予約データの更新に失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: errorMessage }, { status: 500 });
  }
}

// DELETE: 予約の削除
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