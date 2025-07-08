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

// ★★★ 応答メッセージを送信する関数（Reply Message）★★★
async function replyToLine(replyToken: string, text: string) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: text }],
      }),
    });
    if (!response.ok) {
        console.error('Failed to reply to LINE:', await response.text());
    }
  } catch(error) {
      console.error('Error in replyToLine:', error);
  }
}

// 特定のユーザーにプッシュメッセージを送信する関数
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
      if (event.type === 'postback' && event.source.userId && event.replyToken) {
        const postbackData = new URLSearchParams(event.postback.data);
        const action = postbackData.get('action');
        const reservationId = Number(postbackData.get('reservationId'));
        const newParticipantUserId = event.source.userId;
        const replyToken = event.replyToken;

        if (action === 'join' && reservationId) {
          const profile = await getLineProfile(newParticipantUserId);
          if (!profile) {
            await replyToLine(replyToken, 'エラー：LINEプロフィールの取得に失敗しました。');
            continue;
          }
          const newParticipantName = profile.displayName;

          const reservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
          if (!reservation) {
            await replyToLine(replyToken, 'エラー：指定された募集が見つかりませんでした。');
            continue;
          }

          if (reservation.memberNames.includes(newParticipantName)) {
            await replyToLine(replyToken, 'あなたは既にこの募集に参加済みです！');
            continue;
          }
          if (reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers) {
            await replyToLine(replyToken, '申し訳ありません、定員に達したため参加できませんでした。');
            continue;
          }

          const updatedMemberNames = [...reservation.memberNames, newParticipantName];
          await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId));

          await db.insert(members)
            .values({ name: newParticipantName, lineUserId: newParticipantUserId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: newParticipantName } });
          
          // ★★★ 参加者本人への完了通知 ★★★
          await replyToLine(replyToken, '参加を受け付けました！');

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