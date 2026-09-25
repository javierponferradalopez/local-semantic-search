CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"text" text NOT NULL,
	"page" integer,
	"position" integer NOT NULL,
	"cut_version" integer NOT NULL,
	CONSTRAINT "chunks_resource_id_cut_version_position_unique" UNIQUE("resource_id","cut_version","position")
);
--> statement-breakpoint
CREATE TABLE "vectors_384" (
	"chunk_id" uuid NOT NULL,
	"model_repository" text NOT NULL,
	"model_dtype" text NOT NULL,
	"model_width" integer NOT NULL,
	"vector" vector(384) NOT NULL,
	CONSTRAINT "vectors_384_chunk_id_model_repository_model_dtype_pk" PRIMARY KEY("chunk_id","model_repository","model_dtype")
);
--> statement-breakpoint
ALTER TABLE "vectors_384" ADD CONSTRAINT "vectors_384_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE no action ON UPDATE no action;