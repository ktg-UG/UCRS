import { pgTable, serial, integer, date, time, jsonb, text, varchar } from "drizzle-orm/pg-core";

//予約情報テーブル
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

//メンバーテーブル
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  lineUserId: text("line_user_id").unique(),
});

//新球入荷 or イベント用テーブル
export const specialEvents = pgTable("special_events", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  date: date("date").notNull(),
  eventName: text("event_name"),
  memo: text("memo"),
});