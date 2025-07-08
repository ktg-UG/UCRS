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
    console.log('Webhook received:', JSON.stringify(body, null, 2)); // 1. 受信したデータをログに出力
    const events = body.events || [];

    for (const event of events) {
      if (event.type === 'postback') {
        console.log('Postback event received.'); // 2. ポストバックイベントを検知
        const postbackData = new URLSearchParams(event.postback.data);
        const action = postbackData.get('action');
        const reservationId = Number(postbackData.get('reservationId'));
        const newParticipantUserId = event.source.userId;

        console.log(`Action: ${action}, ReservationID: ${reservationId}, ParticipantID: ${newParticipantUserId}`); // 3. データをパース

        if (action === 'join' && reservationId && newParticipantUserId) {
          console.log('Processing "join" action.'); // 4. 参加処理を開始

          const profile = await getLineProfile(newParticipantUserId);
          if (!profile) {
            console.error('Failed to get profile for user:', newParticipantUserId);
            continue; // プロフィールが取れなければ中断
          }
          const newParticipantName = profile.displayName;
          console.log('Participant Name:', newParticipantName); // 5. 参加者の名前を取得

          const reservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
          if (!reservation) {
            console.error('Reservation not found for ID:', reservationId);
            continue; // 予約が見つからなければ中断
          }
          console.log('Found reservation:', reservation); // 6. 予約情報を取得

          if (reservation.memberNames.includes(newParticipantName)) {
            console.log('User is already a member. Aborting.'); // 7a. 参加済みなら中断
            continue;
          }
          if (reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers) {
            console.log('Reservation is full. Aborting.'); // 7b. 満員なら中断
            continue;
          }

          console.log('Adding user to reservation.'); // 8. 更新処理を開始
          const updatedMemberNames = [...reservation.memberNames, newParticipantName];
          await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId));
          console.log('Reservation updated in DB.');

          await db.insert(members)
            .values({ name: newParticipantName, lineUserId: newParticipantUserId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: newParticipantName } });
          console.log('Members table updated.');

          if (reservation.memberNames.length > 0) {
            const ownerName = reservation.memberNames[0];
            console.log('Attempting to notify owner:', ownerName); // 9. 代表者への通知処理を開始

            const owner = await db.query.members.findFirst({ where: eq(members.name, ownerName) });
            if (owner?.lineUserId) {
              console.log('Found owner lineUserId:', owner.lineUserId); // 10a. 代表者のIDを発見
              const notificationText = `${newParticipantName}さんが、${ownerName}さんの募集「${reservation.date} ${reservation.startTime.slice(0,5)}〜」に参加しました！`;
              await sendPushMessage(owner.lineUserId, notificationText);
              console.log('Push message sent to owner.');
            } else {
              // ★★★ おそらくここで処理が終わっている可能性が高いです ★★★
              console.error('Could not find lineUserId for owner:', ownerName, '. Owner object:', owner);
            }
          } else {
            console.log('Reservation has no members, cannot determine owner.');
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