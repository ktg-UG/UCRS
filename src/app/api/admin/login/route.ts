import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "サーバーで管理者パスワードが設定されていません。" },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      // 認証成功
      return NextResponse.json({ success: true });
    } else {
      // 認証失敗
      return NextResponse.json(
        { success: false, error: "パスワードが違います。" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
