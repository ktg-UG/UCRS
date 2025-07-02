// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

export async function POST(req: NextRequest) {
  console.log('API: /api/line/send-message called.');
  if (!LINE_CHANNEL_ACCESS_TOKEN || !NEXT_PUBLIC_APP_BASE_URL) {
    console.error('Environment variables missing: LINE_CHANNEL_ACCESS_TOKEN or NEXT_PUBLIC_APP_BASE_URL');
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN または NEXT_PUBLIC_APP_BASE_URL 環境変数が設定されていません' }, { status: 500 });
  }

  try {
    const { reservationDetails, lineGroupIds } = await req.json();
    console.log('Request body received:', JSON.stringify({ reservationDetails, lineGroupIds }, null, 2));

    if (!reservationDetails || !lineGroupIds || !Array.isArray(lineGroupIds) || lineGroupIds.length === 0) {
      console.error('Validation failed: Missing reservationDetails or lineGroupIds');
      return NextResponse.json({ error: '予約詳細またはLINEグループIDが不足しています' }, { status: 400 });
    }

    // lineGroupIds は単一のグループIDを含むと仮定し、最初の要素を使用
    const targetGroupId = lineGroupIds[0]; 
    if (!targetGroupId) {
        console.error('No valid group ID found in lineGroupIds array.');
        return NextResponse.json({ error: '有効なLINEグループIDが指定されていません' }, { status: 400 });
    }

    // メッセージペイロードは一つで良い
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

    console.log(`Sending message to LINE API (push endpoint) for group: ${targetGroupId}`); // ログメッセージを更新
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', { // ★エンドポイントを push に変更★
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: targetGroupId, // ★単一のグループIDを渡す★
        messages: [messagePayload], // メッセージは配列で渡す
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