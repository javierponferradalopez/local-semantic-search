CREATE TABLE "pictures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"thumbnail_key" text NOT NULL,
	CONSTRAINT "pictures_resource_id_unique" UNIQUE("resource_id")
);
--> statement-breakpoint
CREATE TABLE "picture_vectors_768" (
	"picture_id" uuid NOT NULL,
	"model_repository" text NOT NULL,
	"model_dtype" text NOT NULL,
	"model_width" integer NOT NULL,
	"vector" vector(768) NOT NULL,
	CONSTRAINT "picture_vectors_768_picture_id_model_repository_model_dtype_pk" PRIMARY KEY("picture_id","model_repository","model_dtype")
);
--> statement-breakpoint
ALTER TABLE "picture_vectors_768" ADD CONSTRAINT "picture_vectors_768_picture_id_pictures_id_fk" FOREIGN KEY ("picture_id") REFERENCES "public"."pictures"("id") ON DELETE no action ON UPDATE no action;