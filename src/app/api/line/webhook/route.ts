import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/drizzle";
import { reservations, members } from "@/../drizzle/schema";
import { eq } from 'drizzle-orm';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// LINEのプロフィール取得APIを呼び出す関数
async function getLineProfile(userId: string): Promise<{ displayName: string } | null> {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
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

// LINEに応答メッセージを送信する関数
async function replyToLine(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
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
}

// Webhookのメイン処理
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      // ★★★ ポストバックイベントを処理するロジック ★★★
      if (event.type === 'postback') {
        const postbackData = new URLSearchParams(event.postback.data);
        const action = postbackData.get('action');
        const reservationId = Number(postbackData.get('reservationId'));
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        if (action === 'join' && reservationId && userId) {
          // 1. ユーザーのLINEプロフィールを取得
          const profile = await getLineProfile(userId);
          if (!profile) {
            await replyToLine(replyToken, 'エラー：LINEプロフィールの取得に失敗しました。');
            continue; // 次のイベントへ
          }
          const userName = profile.displayName;

          // 2. データベースで予約情報を更新
          const existingReservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
          if (!existingReservation) {
            await replyToLine(replyToken, 'エラー：指定された募集が見つかりませんでした。');
            continue;
          }
          if (existingReservation.memberNames.includes(userName)) {
            await replyToLine(replyToken, `${userName}さんは既に参加済みです！`);
            continue;
          }
          if (existingReservation.maxMembers && existingReservation.memberNames.length >= existingReservation.maxMembers) {
            await replyToLine(replyToken, '申し訳ありません、定員に達したため参加できませんでした。');
            continue;
          }

          // 3. 参加者リストを更新
          const updatedMemberNames = [...existingReservation.memberNames, userName];
          await db.update(reservations)
            .set({ memberNames: updatedMemberNames })
            .where(eq(reservations.id, reservationId));

          // 4. membersテーブルにも情報を保存
          await db.insert(members)
            .values({ name: userName, lineUserId: userId })
            .onConflictDoUpdate({ target: members.lineUserId, set: { name: userName } });

          // 5. 成功メッセージを返信
          await replyToLine(replyToken, `${userName}さんの参加を受け付けました！`);
        }
      }
      // (ここにテキストメッセージへの応答など、他のイベント処理も追加可能)
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}