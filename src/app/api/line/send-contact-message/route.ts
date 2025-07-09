// src/app/api/line/send-contact-message/route.ts
import { NextRequest, NextResponse } from "next/server";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const ADMIN_LINE_USER_ID = "Ub53b8dcd428fc8224fab1998b639a4ff"; // 通知先の固定ユーザーID

/**
 * 指定されたユーザーにLINEでプッシュメッセージを送信する
 * @param userId 送信先のLINEユーザーID
 * @param text 送信するテキストメッセージ
 */
async function sendPushMessage(userId: string, text: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN is not set.");
    return;
  }
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }],
      }),
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to send push message:", errorData);
    }
  } catch (error) {
    console.error("Error sending push message:", error);
  }
}

export async function POST(req: NextRequest) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "環境変数が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "メッセージが空です" },
        { status: 400 }
      );
    }

    const textToSend = `【UCRS お問い合わせ】\n\n${message}`;

    // 管理者ユーザーにプッシュ通知を送信
    await sendPushMessage(ADMIN_LINE_USER_ID, textToSend);

    return NextResponse.json({
      success: true,
      message: "メッセージを送信しました",
    });
  } catch (error) {
    console.error("お問い合わせメッセージ送信処理中にエラーが発生:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
