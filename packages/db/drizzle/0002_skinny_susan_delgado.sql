CREATE TABLE "my_festival" (
	"visitor_id" text NOT NULL,
	"festival_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"camp" text,
	CONSTRAINT "my_festival_visitor_id_festival_id_pk" PRIMARY KEY("visitor_id","festival_id")
);
--> statement-breakpoint
ALTER TABLE "my_festival" ADD CONSTRAINT "my_festival_visitor_id_visitor_profile_account_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_festival" ADD CONSTRAINT "my_festival_festival_id_festival_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;