import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// LINEのプロフィール取得APIを呼び出す関数
async function getLineProfile(userId: string): Promise<{ displayName: string } | null> {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (!response.ok) {
      console.error('Failed to get LINE profile:', await response.text());
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getLineProfile:', error);
    return null;
  }
}

// ★★★ 特定のユーザーにプッシュメッセージを送信する関数 ★★★
async function sendPushMessage(userId: string, text: string) {
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text }],
      }),
    });
  } catch (error) {
    console.error('Error sending push message:', error);
  }
}

// Webhookのメイン処理
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type === 'postback') {
        const postbackData = new URLSearchParams(event.postback.data);
        const action = postbackData.get('action');
        const reservationId = Number(postbackData.get('reservationId'));
        const newParticipantUserId = event.source.userId; // 参加ボタンを押した人のID

        if (action === 'join' && reservationId && newParticipantUserId) {
          // 1. 参加者のLINEプロフィールを取得
          const profile = await getLineProfile(newParticipantUserId);
          if (!profile) continue;
          const newParticipantName = profile.displayName;

          // 2. データベースで予約情報を取得・チェック
          const reservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
          if (!reservation) continue;
          if (reservation.memberNames.includes(newParticipantName)) continue; // 既に参加済み
          if (reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers) continue; // 定員オーバー

          // 3. 参加者リストを更新
          const updatedMemberNames = [...reservation.memberNames, newParticipantName];
          await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId));

          // 4. 新しい参加者の情報をmembersテーブルに保存
          await db.insert(members)
            .values({ name: newParticipantName, lineUserId: newParticipantUserId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: newParticipantName } });

          // 5. ★★★ 募集者の個人LINEに通知を送信 ★★★
          if (reservation.memberNames.length > 0) {
            const ownerName = reservation.memberNames[0]; // 最初のメンバーを募集者とみなす
            // 募集者のlineUserIdをmembersテーブルから検索
            const owner = await db.query.members.findFirst({ where: eq(members.name, ownerName) });

            if (owner?.lineUserId) {
              const notificationText = `${newParticipantName}さんが、${ownerName}さんの募集「${reservation.date} ${reservation.startTime.slice(0,5)}〜」に参加しました！`;
              await sendPushMessage(owner.lineUserId, notificationText);
            }
          }
        }
      }
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}