// drizzle/schema.ts
import { pgTable, serial, integer, date, time, jsonb, text, varchar } from "drizzle-orm/pg-core";

// 既存のreservationsテーブル
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxMembers: integer("max_members"),
  memberNames: jsonb("member_names").notNull().$type<string[]>(),
  purpose: text("purpose").notNull(),
  comment: text("comment"),
});

// 既存のmembersテーブル
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  lineUserId: text("line_user_id").unique(),
});

// ↓↓↓ ここから追加 ↓↓↓
// 新球入荷・イベント用の新しいテーブル
export const specialEvents = pgTable("special_events", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'new_balls' or 'event'
  date: date("date").notNull(),
  eventName: text("event_name"), // イベント名 (イベントの場合のみ)
  memo: text("memo"), // メモ (イベントの場合のみ)
});
// ↑↑↑ ここまで追加 ↑↑↑