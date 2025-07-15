import { NextRequest, NextResponse } from "next/server";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const LINE_GROUP_ID = process.env.LINE_GROUP_ID;

export const dynamic = "force-dynamic";

/**
 * 日付文字列 (YYYY/MM/DD) を「月日(曜日)」形式にフォーマットします。
 * @param dateString - YYYY/MM/DD 形式の日付文字列
 * @returns フォーマットされた日付文字列 (例: 7月16日(火))
 */
const formatJapaneseDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // getTime() が NaN を返す場合、無効な日付と判断
    if (isNaN(date.getTime())) {
      return dateString; // パース失敗時は元の文字列を返す
    }

    const month = date.getMonth() + 1; // getMonth() は 0 から始まるため +1
    const day = date.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()]; // getDay() は 0 (日) から 6 (土) を返す

    return `${month}月${day}日(${weekday})`;
  } catch (e) {
    console.error("日付のフォーマット中にエラーが発生しました:", e);
    return dateString; // 万が一のエラー時も元の文字列を返す
  }
};

export async function POST(req: NextRequest) {
  if (
    !LINE_CHANNEL_ACCESS_TOKEN ||
    !NEXT_PUBLIC_APP_BASE_URL ||
    !LINE_GROUP_ID
  ) {
    console.error("必要な環境変数が設定されていません");
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
    const purpose = reservationDetails.purpose || "未設定";

    let comment = reservationDetails.comment || "";
    if (comment.length > 20) {
      comment = comment.substring(0, 20) + "...";
    }

    const titleForLine = `🎾 ${formattedDate}の新規募集`;
    const textForLine = [
      `時間: ${reservationDetails.startTime}〜${reservationDetails.endTime}`,
      `募集者: ${reservationDetails.ownerName}`,
      `目的: ${purpose}`,
      `コメント: ${comment || "なし"}`,
    ]
      .join("\n")
      .trim();

    const messagePayload = {
      type: "template",
      altText: "新しいテニス募集があります！",
      template: {
        type: "buttons",
        title: titleForLine,
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
      console.error("LINEメッセージの送信に失敗しました:", errorData);
      return NextResponse.json(
        { error: "LINEメッセージの送信に失敗しました", details: errorData },
        { status: lineRes.status }
      );
    }
  } catch (error) {
    console.error("LINEメッセージ送信中に予期せぬエラーが発生しました:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
