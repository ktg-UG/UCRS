import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema"; 
import { eq } from 'drizzle-orm';

const isMultipleOf15Minutes = (time: string): boolean => {
  if (!time || !time.includes(':')) return false;
  const minutes = parseInt(time.split(':')[1], 10);
  return !isNaN(minutes) && minutes % 15 === 0;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  try {
    if (date) {
      const data = await db.select().from(reservations).where(eq(reservations.date, date));
      return NextResponse.json(data);
    }
    const data = await db.select().from(reservations);
    return NextResponse.json(data);
  } catch (error) {
    console.error('データベースからの予約データ取得に失敗:', error);
    return NextResponse.json({ error: '予約データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, maxMembers, memberNames, purpose } = body;

    if (!date || !startTime || !endTime || !maxMembers || !purpose || !memberNames) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    if (!isMultipleOf15Minutes(startTime) || !isMultipleOf15Minutes(endTime)) {
      return NextResponse.json({ error: '時間は15分単位で指定してください' }, { status: 400 });
    }
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return NextResponse.json({ error: '過去の日付には予約できません' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: '終了時刻は開始時刻より後に設定してください' }, { status: 400 });
    }

    const existingReservations = await db.select().from(reservations).where(eq(reservations.date, date));
    const newStart = new Date(`1970-01-01T${startTime}`);
    const newEnd = new Date(`1970-01-01T${endTime}`);
    if (existingReservations.some(e => new Date(`1970-01-01T${e.startTime}`) < newEnd && new Date(`1970-01-01T${e.endTime}`) > newStart)) {
      return NextResponse.json({ error: '指定された時間帯は既に他の予約と重複しています' }, { status: 409 });
    }

    const result = await db.insert(reservations).values({ date, startTime, endTime, maxMembers, memberNames, purpose }).returning();
    return NextResponse.json(result[0], { status: 201 });

  } catch (error) {
    console.error('予約データの作成に失敗:', error);
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 });
  }
}