// src/app/api/line/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // LINEからのWebhookイベントを受け取るだけなので、
  // 現時点ではリクエストボディを処理する必要はありません。
  // ただし、ログに何が来ているか確認したい場合は以下の行を有効化できます。
  const body = await req.json();
  console.log('LINE Webhook received:', JSON.stringify(body, null, 2));

  // LINEプラットフォームからの検証リクエストに対しては、
  // 常にステータスコード200を返す必要があります。
  return NextResponse.json({ message: "OK" }, { status: 200 });
}

// LINE Developersの検証でGETリクエストが送られることは通常ありませんが、
// 念のためGETリクエストも許可し、分かりやすいメッセージを返しておくと良いでしょう。
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      message:
        "This is the LINE Webhook endpoint. Please send POST requests with LINE events.",
    },
    { status: 200 }
  );
}
