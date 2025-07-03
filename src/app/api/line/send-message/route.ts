// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const LINE_GROUP_ID = process.env.LINE_GROUP_ID;

/**
 * 'yyyy/MM/dd' 形式の日付文字列を 'M月d日' 形式に変換するヘルパー関数
 * @param dateString - 'yyyy/MM/dd' 形式の日付文字列
 * @returns 'M月d日' 形式の文字列
 */
const formatJapaneseDate = (dateString: string): string => {
  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${month}月${day}日`;
    }
  } catch (e) {
    // パースに失敗した場合は元の文字列を返す
    return dateString;
  }
  return dateString;
};

export async function POST(req: NextRequest) {
  console.log('API: /api/line/send-message called.');

  if (!LINE_CHANNEL_ACCESS_TOKEN || !NEXT_PUBLIC_APP_BASE_URL || !LINE_GROUP_ID) {
    console.error('Environment variables missing');
    return NextResponse.json({ error: '環境変数が設定されていません' }, { status: 500 });
  }

  try {
    const { reservationDetails } = await req.json();
    if (!reservationDetails) {
      return NextResponse.json({ error: '予約詳細が不足しています' }, { status: 400 });
    }

    // --- ▼ メッセージ内容を要件に合わせて変更 ▼ ---
    const formattedDate = formatJapaneseDate(reservationDetails.date);
    const textMessage = [
      `新規募集 : ${formattedDate} ${reservationDetails.startTime}から${reservationDetails.endTime}`,
      `募集者 : ${reservationDetails.ownerName}`,
      `目的: ${reservationDetails.purpose || '未設定'}`
    ].join('\n'); // 各行を改行で結合

    const messagePayload = {
      type: 'template',
      altText: '新しいテニス募集があります！',
      template: {
        type: 'buttons',
        title: '🎾 新しいテニス募集！',
        text: textMessage, // 組み立てたテキストを使用
        actions: [
          {
            type: 'uri',
            label: '詳細', // ボタンのラベルを「詳細」に変更
            uri: `${NEXT_PUBLIC_APP_BASE_URL}/reserve/${reservationDetails.id}`,
          },
          { // 「参加」ボタンを追加
            type: 'uri',
            label: '参加',
            // 「参加」ボタンも、まずは詳細ページに遷移させる仕様とします
            uri: `${NEXT_PUBLIC_APP_BASE_URL}/reserve/${reservationDetails.id}`,
          },
        ],
      },
    };
    // --- ▲ メッセージ内容の変更ここまで ▲ ---

    console.log(`Sending message to LINE API (push endpoint) for group: ${LINE_GROUP_ID}`);
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