CREATE TABLE "image_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_key" text NOT NULL,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"ingest_state" text NOT NULL,
	"reason" text,
	CONSTRAINT "image_resources_checksum_unique" UNIQUE("checksum")
);
