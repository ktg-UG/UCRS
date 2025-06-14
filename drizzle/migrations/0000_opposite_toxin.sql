CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" varchar(255) NOT NULL,
	"court" varchar(255) NOT NULL,
	"date" timestamp NOT NULL
);
