ALTER TABLE "members" ADD COLUMN "line_user_id" text;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_line_user_id_unique" UNIQUE("line_user_id");