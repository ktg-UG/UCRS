// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

export async function POST(req: NextRequest) {
  console.log('API: /api/line/send-message called.'); // 追加ログ
  if (!LINE_CHANNEL_ACCESS_TOKEN || !NEXT_PUBLIC_APP_BASE_URL) {
    console.error('Environment variables missing: LINE_CHANNEL_ACCESS_TOKEN or NEXT_PUBLIC_APP_BASE_URL'); // 追加ログ
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN または NEXT_PUBLIC_APP_BASE_URL 環境変数が設定されていません' }, { status: 500 });
  }

  try {
    const { reservationDetails, lineGroupIds } = await req.json();
    console.log('Request body received:', JSON.stringify({ reservationDetails, lineGroupIds }, null, 2)); // 追加ログ

    if (!reservationDetails || !lineGroupIds || !Array.isArray(lineGroupIds) || lineGroupIds.length === 0) {
      console.error('Validation failed: Missing reservationDetails or lineGroupIds'); // 追加ログ
      return NextResponse.json({ error: '予約詳細またはLINEグループIDが不足しています' }, { status: 400 });
    }

    const messages = lineGroupIds.map((groupId: string) => ({
      to: groupId,
      messages: [
        {
          type: 'template',
          altText: '新しいテニス募集があります！',
          template: {
            type: 'buttons',
            // ★以下の thumbnailImageUrl の行を完全に削除またはコメントアウトします★
            // thumbnailImageUrl: `${NEXT_PUBLIC_APP_BASE_URL}/tennis_image.jpg`,
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
        },
      ],
    }));

    console.log('Sending message to LINE API...'); // 追加ログ
    const lineRes = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineGroupIds,
        messages: messages[0].messages,
      }),
    });
    console.log(`LINE API response status: ${lineRes.status} ${lineRes.statusText}`); // 追加ログ

    if (lineRes.ok) {
      console.log('LINEメッセージ送信成功:', await lineRes.json());
      return NextResponse.json({ message: 'LINEメッセージを送信しました' });
    } else {
      const errorData = await lineRes.json();
      console.error('LINEメッセージ送信失敗:', errorData);
      // HTTPステータスコードをそのまま返すことで、より詳細なエラー情報をクライアントに伝える
      return NextResponse.json({ error: 'LINEメッセージ送信に失敗しました', details: errorData }, { status: lineRes.status });
    }
  } catch (error) {
    console.error('LINEメッセージ送信中に予期せぬエラーが発生:', error); // 追加ログ
    // エラーオブジェクト全体を文字列化してログに出力
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}