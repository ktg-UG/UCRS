// drizzle/schema.ts
import { pgTable, serial, integer, date, time, jsonb, text } from "drizzle-orm/pg-core";

// 既存のreservationsテーブル
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxMembers: integer("max_members"),
  memberNames: jsonb("member_names").notNull().$type<string[]>(),
  purpose: text("purpose").notNull(),
});

// membersテーブルから lineUserId を削除
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // メンバー名は必須、かつ重複しない
  // lineUserId: text("line_user_id").unique() の行を削除
});