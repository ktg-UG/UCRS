// src/app/api/line/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 環境変数からトークンを取得
// LINE_CHANNEL_SECRETはMessaging APIのWebhook認証で必要ですが、今回は直接Push Messageを送るため
// 現時点では必須ではありません。将来的な機能拡張のために記載しています。
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

export async function POST(req: NextRequest) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !NEXT_PUBLIC_APP_BASE_URL) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN または NEXT_PUBLIC_APP_BASE_URL 環境変数が設定されていません' }, { status: 500 });
  }

  try {
    const { reservationDetails, lineGroupIds } = await req.json();

    if (!reservationDetails || !lineGroupIds || !Array.isArray(lineGroupIds) || lineGroupIds.length === 0) {
      return NextResponse.json({ error: '予約詳細またはLINEグループIDが不足しています' }, { status: 400 });
    }

    // 各グループIDに対してメッセージオブジェクトを生成
    const messages = lineGroupIds.map((groupId: string) => ({
      to: groupId, // 送信先のグループID
      messages: [
        {
          type: 'template',
          altText: '新しいテニス募集があります！', // 通知メッセージ（LINEの通知に表示されるテキスト）
          template: {
            type: 'buttons',
            // 画像URLは任意です。必要に応じてパスを調整してください。
            // 例: publicフォルダにtennis_image.jpgを置く場合
            thumbnailImageUrl: `${NEXT_PUBLIC_APP_BASE_URL}/tennis_image.jpg`, 
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

    // LINE Messaging APIのmulticastエンドポイントを使用して、複数のグループに一斉送信
    // または、messages配列をループして個別にpushメッセージを送信することも可能です。
    // multicastは一度のリクエストで最大150件のto（ユーザーID、グループID、ルームID）に送信できます。
    const lineRes = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineGroupIds, // 配列でグループIDを指定
        messages: messages[0].messages, // 全てのメッセージが同じ内容なので最初のメッセージを使う
      }),
    });

    if (lineRes.ok) {
      console.log('LINEメッセージ送信成功:', await lineRes.json());
      return NextResponse.json({ message: 'LINEメッセージを送信しました' });
    } else {
      const errorData = await lineRes.json();
      console.error('LINEメッセージ送信失敗:', errorData);
      return NextResponse.json({ error: 'LINEメッセージ送信に失敗しました', details: errorData }, { status: lineRes.status });
    }
  } catch (error) {
    console.error('LINEメッセージ送信中にエラーが発生:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}