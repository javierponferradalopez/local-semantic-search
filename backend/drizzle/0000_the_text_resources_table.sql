-- Drizzle cannot declare an extension, so this line is written by hand (ADR-0001).
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "text_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_key" text NOT NULL,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"ingest_state" text NOT NULL,
	"reason" text,
	CONSTRAINT "text_resources_checksum_unique" UNIQUE("checksum")
);
