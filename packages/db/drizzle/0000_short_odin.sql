CREATE TYPE "public"."locale" AS ENUM('de', 'en');--> statement-breakpoint
CREATE TABLE "festival" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"default_locale" "locale" DEFAULT 'de' NOT NULL,
	"cashless_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "festival_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "festival_locale" (
	"festival_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	CONSTRAINT "festival_locale_festival_id_locale_pk" PRIMARY KEY("festival_id","locale")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"festival_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_festival_slug_unq" UNIQUE("festival_id","slug")
);
--> statement-breakpoint
CREATE TABLE "tag_translation" (
	"tag_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "tag_translation_tag_id_locale_pk" PRIMARY KEY("tag_id","locale")
);
--> statement-breakpoint
ALTER TABLE "festival_locale" ADD CONSTRAINT "festival_locale_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translation" ADD CONSTRAINT "tag_translation_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;