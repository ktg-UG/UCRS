// npx drizzle-kit generate
// npx drizzle-kit push
import { pgTable, serial, integer, date, time, jsonb } from "drizzle-orm/pg-core";

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxMembers: integer("max_members"),
  memberNames: jsonb("member_names").notNull(),
});