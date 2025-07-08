import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ★★★ 連打防止用のリクエスト管理ストア ★★★
// 同じリクエストが短時間に来た場合に処理を1回に制限するためのもの
const processingRequests = new Map<string, boolean>();

// LINEのプロフィール取得APIを呼び出す関数
async function getLineProfile(userId: string): Promise<{ displayName:string } | null> {
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

// 特定のユーザーにプッシュメッセージを送信する関数
async function sendPushMessage(userId: string, text: string) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
    });
    if (!response.ok) {
        console.error('Failed to send push message:', await response.text());
    }
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
      if (event.type === 'postback' && event.source.userId) {
        const postbackData = new URLSearchParams(event.postback.data);
        const action = postbackData.get('action');
        const reservationId = Number(postbackData.get('reservationId'));
        const newParticipantUserId = event.source.userId;

        if (action === 'join' && reservationId) {
          // ★★★ 連打防止ロジックの開始 ★★★
          const requestId = `join-${newParticipantUserId}-${reservationId}`; // リクエストを特定するユニークなID
          
          // このリクエストが既に処理中であれば、何もしないで終了
          if (processingRequests.has(requestId)) {
            console.log(`Request ${requestId} is already being processed. Skipping.`);
            continue; 
          }

          // リクエストの処理を開始したことを記録（15秒間のロック）
          processingRequests.set(requestId, true);
          setTimeout(() => {
            processingRequests.delete(requestId);
          }, 15000); // 15秒後にロックを解除
          // ★★★ 連打防止ロジックの終了 ★★★

          const profile = await getLineProfile(newParticipantUserId);
          if (!profile) continue;
          
          const newParticipantName = profile.displayName;

          const reservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
          if (!reservation) {
            await sendPushMessage(newParticipantUserId, 'エラー：指定された募集が見つかりませんでした。');
            continue;
          }

          if (reservation.memberNames.includes(newParticipantName)) {
            await sendPushMessage(newParticipantUserId, 'あなたは既にこの募集に参加済みです！');
            continue;
          }
          if (reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers) {
            await sendPushMessage(newParticipantUserId, '申し訳ありません、定員に達したため参加できませんでした。');
            continue;
          }

          const updatedMemberNames = [...reservation.memberNames, newParticipantName];
          await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId));

          await db.insert(members)
            .values({ name: newParticipantName, lineUserId: newParticipantUserId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: newParticipantName } });
          
          await sendPushMessage(newParticipantUserId, '参加を受け付けました！');

          if (reservation.memberNames.length > 0) {
            const ownerName = reservation.memberNames[0];
            const owner = await db.query.members.findFirst({ where: eq(members.name, ownerName) });

            if (owner?.lineUserId && owner.lineUserId !== newParticipantUserId) {
              const notificationText = `${newParticipantName}さんが、${ownerName}さんの募集「${reservation.date} ${reservation.startTime.slice(0,5)}〜」に参加しました！`;
              await sendPushMessage(owner.lineUserId, notificationText);
            }
          }
        }
      }
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Unhandled Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}