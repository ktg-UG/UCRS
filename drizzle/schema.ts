import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  user: varchar("user", { length: 255 }).notNull(),
  court: varchar("court", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
});
