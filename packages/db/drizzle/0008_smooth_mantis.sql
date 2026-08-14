CREATE TABLE "activity_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"festival_id" uuid,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_tag_translation" (
	"tag_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "activity_tag_translation_tag_id_locale_pk" PRIMARY KEY("tag_id","locale")
);
--> statement-breakpoint
CREATE TABLE "festival_activity_tag" (
	"festival_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "festival_activity_tag_pk" PRIMARY KEY("festival_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "activity_tag" ADD CONSTRAINT "activity_tag_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_tag_translation" ADD CONSTRAINT "activity_tag_translation_tag_id_activity_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."activity_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_activity_tag" ADD CONSTRAINT "festival_activity_tag_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_activity_tag" ADD CONSTRAINT "festival_activity_tag_tag_id_activity_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."activity_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_tag_global_slug_unq" ON "activity_tag" USING btree ("slug") WHERE "activity_tag"."festival_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_tag_festival_slug_unq" ON "activity_tag" USING btree ("festival_id","slug") WHERE "activity_tag"."festival_id" is not null;