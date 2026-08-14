CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"festival_id" uuid NOT NULL,
	"creator_id" text NOT NULL,
	"tag_id" uuid,
	"title" text,
	"subtitle" text,
	"description" text,
	"location" text,
	"geo_lat" double precision,
	"geo_lng" double precision,
	"start_time" timestamp with time zone NOT NULL,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_id_festival_unq" UNIQUE("id","festival_id"),
	CONSTRAINT "activity_title_or_tag_chk" CHECK ("activity"."tag_id" is not null or "activity"."title" is not null),
	CONSTRAINT "activity_capacity_positive_chk" CHECK ("activity"."capacity" is null or "activity"."capacity" >= 1),
	CONSTRAINT "activity_geo_pair_chk" CHECK (("activity"."geo_lat" is null) = ("activity"."geo_lng" is null)),
	CONSTRAINT "activity_geo_range_chk" CHECK (("activity"."geo_lat" is null or ("activity"."geo_lat" >= -90 and "activity"."geo_lat" <= 90)) and ("activity"."geo_lng" is null or ("activity"."geo_lng" >= -180 and "activity"."geo_lng" <= 180)))
);
--> statement-breakpoint
CREATE TABLE "activity_participant" (
	"activity_id" uuid NOT NULL,
	"festival_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_participant_pk" PRIMARY KEY("activity_id","visitor_id")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_creator_id_visitor_profile_account_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_tag_id_activity_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."activity_tag"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participant" ADD CONSTRAINT "activity_participant_visitor_id_visitor_profile_account_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participant" ADD CONSTRAINT "activity_participant_activity_fk" FOREIGN KEY ("activity_id","festival_id") REFERENCES "public"."activity"("id","festival_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_festival_start_idx" ON "activity" USING btree ("festival_id","start_time");