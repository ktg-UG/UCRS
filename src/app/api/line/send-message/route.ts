// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

// (中略: formatJapaneseDateなどの関数はそのまま)
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const LINE_GROUP_ID = process.env.LINE_GROUP_ID;

const formatJapaneseDate = (dateString: string): string => {
  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${month}月${day}日`;
    }
  } catch (e) {
    return dateString;
  }
  return dateString;
};


export async function POST(req: NextRequest) {
  // (中略: エラーチェックなどはそのまま)

  try {
    const { reservationDetails } = await req.json();
    if (!reservationDetails) {
      return NextResponse.json({ error: '予約詳細が不足しています' }, { status: 400 });
    }

    const formattedDate = formatJapaneseDate(reservationDetails.date);
    const textMessage = [
      `新規募集 : ${formattedDate} ${reservationDetails.startTime}から${reservationDetails.endTime}`,
      `募集者 : ${reservationDetails.ownerName}`,
      `目的: ${reservationDetails.purpose || '未設定'}`
    ].join('\n');

    const messagePayload = {
      type: 'template',
      altText: '新しいテニス募集があります！',
      template: {
        type: 'buttons',
        title: '🎾 新しいテニス募集！',
        text: textMessage,
        actions: [
          {
            type: 'uri',
            label: '詳細',
            // ★ リンク先を新しい reservation_detail ページに変更
            uri: `${NEXT_PUBLIC_APP_BASE_URL}/reservation_detail/${reservationDetails.id}`,
          },
          {
            type: 'uri',
            label: '参加',
            // ★ リンク先を新しい reservation_detail ページに変更
            uri: `${NEXT_PUBLIC_APP_BASE_URL}/reservation_detail/${reservationDetails.id}`,
          },
        ],
      },
    };

    // (中略: LINEへの送信処理はそのまま)
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [messagePayload],
      }),
    });

    if (lineRes.ok) {
      return NextResponse.json({ message: 'LINEメッセージを送信しました' });
    } else {
      const errorData = await lineRes.json();
      return NextResponse.json({ error: 'LINEメッセージ送信に失敗しました', details: errorData }, { status: lineRes.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}