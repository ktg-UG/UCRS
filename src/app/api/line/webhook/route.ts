import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ★★★ 日付フォーマット用のヘルパー関数を追加 ★★★
const formatJapaneseDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  } catch (e) {
    return dateString;
  }
};

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
          const requestId = `join-${newParticipantUserId}-${reservationId}`;
          if (processingRequests.has(requestId)) {
            continue;
          }
          processingRequests.set(requestId, true);
          setTimeout(() => processingRequests.delete(requestId), 15000);

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
          
          // ★★★ 参加者本人への完了通知メッセージを修正 ★★★
          const formattedDate = formatJapaneseDate(reservation.date);
          const startTime = reservation.startTime.slice(0, 5);
          const confirmationText = `${formattedDate}${startTime}からのコート予約メンバーに参加しました！`;
          await sendPushMessage(newParticipantUserId, confirmationText);

          // 募集者への通知
          if (reservation.memberNames.length > 0) {
            const ownerName = reservation.memberNames[0];
            const owner = await db.query.members.findFirst({ where: eq(members.name, ownerName) });

            if (owner?.lineUserId && owner.lineUserId !== newParticipantUserId) {
              const notificationText = `${newParticipantName}さんが、${ownerName}さんの募集「${reservation.date} ${startTime}〜」に参加しました！`;
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

const processingRequests = new Map<string, boolean>();