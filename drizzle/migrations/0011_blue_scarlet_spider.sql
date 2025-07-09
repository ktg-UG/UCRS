CREATE TABLE "special_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"event_name" text,
	"memo" text
);
