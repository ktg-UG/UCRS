ALTER TABLE "reservations" ADD COLUMN "start_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "end_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "max_members" integer;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "member_ids" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" DROP COLUMN "user";--> statement-breakpoint
ALTER TABLE "reservations" DROP COLUMN "court";