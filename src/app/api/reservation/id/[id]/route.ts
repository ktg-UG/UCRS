// src/app/api/reservation/id/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema"; // members スキーマをインポート/route.ts]
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const reservationId = Number(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: '無効なID形式です' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // ★ 追加されたフィールド: action, lineUserId, lineUserName (LINE参加ボタン用) ★
    const { startTime, endTime, purpose, maxMembers, memberNames, action, lineUserId, lineUserName } = body; 

    // ★ LINEからの参加アクションの場合の処理 ★
    if (action === 'join') {
        if (!lineUserId || !lineUserName) {
            return NextResponse.json({ error: 'LINEユーザー情報が不足しています' }, { status: 400 });
        }

        const existingReservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
        if (!existingReservation) {
            return NextResponse.json({ error: '指定された予約が見つかりません' }, { status: 404 });
        }

        // 既にメンバーに含まれているか確認
        if (existingReservation.memberNames.includes(lineUserName)) {
            // 既に存在する場合は成功とみなすが、更新は行わない
            return NextResponse.json({ message: '既に予約に参加しています', updatedReservation: existingReservation }, { status: 200 }); 
        }

        // 定員オーバーチェック
        if (existingReservation.memberNames.length >= existingReservation.maxMembers) {
            return NextResponse.json({ error: '定員に達しているため参加できません' }, { status: 409 });
        }

        const updatedMemberNames = [...existingReservation.memberNames, lineUserName];

        // membersテーブルにLINEユーザー名を登録 (存在しない場合)
        // lineUserIdも一緒に保存
        await db.insert(members).values({ name: lineUserName, lineUserId: lineUserId }).onConflictDoNothing();/route.ts]

        const updatedReservation = await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId))
            .returning();

        if (updatedReservation.length === 0) {
            return NextResponse.json({ error: '参加登録対象の予約が見つかりません' }, { status: 404 });
        }

        // ★ 代表者への通知（LINE Push Message）のロジックをここに追加 ★
        // 現状では代表者のLINE UserIdを直接持っていないため、
        // ここに実装する場合は、代表者のLINE UserIdを別途取得・管理する仕組みが必要です。
        // 例: 予約作成時に代表者のLINE UserIdをmemberNamesと一緒に保存するか、
        // membersテーブルのnameからlineUserIdを検索する
        const representativeMember = await db.query.members.findFirst({
            where: eq(members.name, existingReservation.memberNames[0]),
            columns: { lineUserId: true } // lineUserIdのみを取得
        });

        if (representativeMember && representativeMember.lineUserId) {
            try {
                // LINE Push Messageを送信するAPIを呼び出す（このAPIも別途実装が必要です）
                const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; // 環境変数を再取得
                if (!LINE_CHANNEL_ACCESS_TOKEN) {
                    console.warn('LINE_CHANNEL_ACCESS_TOKENが設定されていないため、代表者への通知はスキップされました。');
                } else {
                    await fetch('https://api.line.me/v2/bot/message/push', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                        },
                        body: JSON.stringify({
                            to: representativeMember.lineUserId,
                            messages: [{
                                type: 'text',
                                text: `${lineUserName}さんがあなたの予約（${existingReservation.date} ${existingReservation.startTime}〜）に参加しました！`
                            }]
                        }),
                    });
                    console.log(`代表者 (${representativeMember.lineUserId}) へ参加通知を送信しました。`);
                }
            } catch (pushError) {
                console.error('代表者へのLINE通知送信中にエラーが発生:', pushError);
            }
        }
        // ★ ここまで追加 ★

        return NextResponse.json(updatedReservation[0]);

    } else {
        // ★ 既存の更新ロジック (ReservationFormからの編集保存) ★
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
                // ここではlineUserIdは不明なので、nameのみでonConflictDoNothing
                await db.insert(members).values(newMembers).onConflictDoNothing();/route.ts, uploaded:ktg-ug/ucrs/UCRS-4d1f47117fe56774d85aac823ab0ed55a77ab337/src/app/api/reservation/route.ts]
            }
        }

        const updatedReservations = await db.update(reservations).set({ startTime, endTime, maxMembers, memberNames, purpose }).where(eq(reservations.id, reservationId)).returning();
        if (updatedReservations.length === 0) {
          return NextResponse.json({ error: '更新対象の予約が見つかりません' }, { status: 404 });
        }
        return NextResponse.json(updatedReservations[0]);
    }

  } catch (error) {
    console.error('予約データの更新に失敗:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
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