import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { members } from "@/../drizzle/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    // メンバーを名前順で取得
    const allMembers = await db
      .select({
        name: members.name,
      })
      .from(members)
      .orderBy(asc(members.name));

    // オブジェクトの配列 {name: string}[] から、名前の配列 string[] に変換
    const memberNames = allMembers.map(m => m.name);

    return NextResponse.json(memberNames);
  } catch (error) {
    console.error("メンバー一覧の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}