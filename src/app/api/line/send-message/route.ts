import { NextRequest, NextResponse } from "next/server";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const LINE_GROUP_ID = process.env.LINE_GROUP_ID;

export const dynamic = 'force-dynamic'

const formatJapaneseDate = (dateString: string): string => {
  try {
    const parts = dateString.split("/");
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
  if (
    !LINE_CHANNEL_ACCESS_TOKEN ||
    !NEXT_PUBLIC_APP_BASE_URL ||
    !LINE_GROUP_ID
  ) {
    console.error("Environment variables missing");
    return NextResponse.json(
      { error: "環境変数が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { reservationDetails } = await req.json();
    if (!reservationDetails) {
      return NextResponse.json(
        { error: "予約詳細が不足しています" },
        { status: 400 }
      );
    }

    const formattedDate = formatJapaneseDate(reservationDetails.date);

    // コメントがあればメッセージに追加
    let textForLine = [
      `新規募集 : ${formattedDate} ${reservationDetails.startTime}から${reservationDetails.endTime}`,
      `募集者 : ${reservationDetails.ownerName}`,
      `目的: ${reservationDetails.purpose || "未設定"}`,
    ].join("\n");

    if (reservationDetails.comment) {
      textForLine += `\nコメント: ${reservationDetails.comment}`;
    }

    const messagePayload = {
      type: "template",
      altText: "新しいテニス募集があります！",
      template: {
        type: "buttons",
        title: "🎾 新しいテニス募集！",
        text: textForLine,
        actions: [
          {
            type: "postback",
            label: "参加する",
            data: `action=join&reservationId=${reservationDetails.id}`,
          },
          {
            type: "uri",
            label: "詳細・メンバー編集",
            uri: `${NEXT_PUBLIC_APP_BASE_URL}/reserve/${reservationDetails.id}?edit=true`,
          },
        ],
      },
    };

    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [messagePayload],
      }),
    });

    if (lineRes.ok) {
      return NextResponse.json({ message: "LINEメッセージを送信しました" });
    } else {
      const errorData = await lineRes.json();
      console.error("LINEメッセージ送信失敗:", errorData);
      return NextResponse.json(
        { error: "LINEメッセージ送信に失敗しました", details: errorData },
        { status: lineRes.status }
      );
    }
  } catch (error) {
    console.error("LINEメッセージ送信中に予期せぬエラーが発生:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
