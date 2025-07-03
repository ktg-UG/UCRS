// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const LINE_GROUP_ID = process.env.LINE_GROUP_ID; // 通知先のグループIDを環境変数から読み込む

export async function POST(req: NextRequest) {
  console.log('API: /api/line/send-message called.');

  // 環境変数の存在チェックを更新
  if (!LINE_CHANNEL_ACCESS_TOKEN || !NEXT_PUBLIC_APP_BASE_URL || !LINE_GROUP_ID) {
    console.error('Environment variables missing: LINE_CHANNEL_ACCESS_TOKEN, NEXT_PUBLIC_APP_BASE_URL, or LINE_GROUP_ID');
    return NextResponse.json({ error: '環境変数が設定されていません' }, { status: 500 });
  }

  try {
    const { reservationDetails } = await req.json(); // lineGroupIds を受け取らないように変更
    console.log('Request body received:', JSON.stringify({ reservationDetails }, null, 2));

    if (!reservationDetails) { // バリデーションを更新
      console.error('Validation failed: Missing reservationDetails');
      return NextResponse.json({ error: '予約詳細が不足しています' }, { status: 400 });
    }

    const messagePayload = {
        type: 'template',
        altText: '新しいテニス募集があります！',
        template: {
            type: 'buttons',
            title: '🎾 新しいテニス募集！',
            text: `${reservationDetails.date} ${reservationDetails.startTime} から ${reservationDetails.maxMembers}人募集！\n募集者: ${reservationDetails.ownerName}\n目的: ${reservationDetails.purpose || '未設定'}`,
            actions: [
                {
                    type: 'uri',
                    label: '詳細を見る・参加する',
                    uri: `${NEXT_PUBLIC_APP_BASE_URL}/reserve/${reservationDetails.id}`,
                },
            ],
        },
    };

    console.log(`Sending message to LINE API (push endpoint) for group: ${LINE_GROUP_ID}`);
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID, // 環境変数から読み込んだグループIDを使用
        messages: [messagePayload],
      }),
    });
    console.log(`LINE API response status: ${lineRes.status} ${lineRes.statusText}`);

    if (lineRes.ok) {
      console.log('LINEメッセージ送信成功:', await lineRes.json());
      return NextResponse.json({ message: 'LINEメッセージを送信しました' });
    } else {
      const errorData = await lineRes.json();
      console.error('LINEメッセージ送信失敗:', errorData);
      return NextResponse.json({ error: 'LINEメッセージ送信に失敗しました', details: errorData }, { status: lineRes.status });
    }
  } catch (error) {
    console.error('LINEメッセージ送信中に予期せぬエラーが発生:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}