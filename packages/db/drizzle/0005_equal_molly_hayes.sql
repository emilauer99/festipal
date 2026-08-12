CREATE TABLE "friendship" (
	"lower_id" text NOT NULL,
	"higher_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendship_pair_pk" PRIMARY KEY("lower_id","higher_id"),
	CONSTRAINT "friendship_pair_order_chk" CHECK ("friendship"."lower_id" < "friendship"."higher_id")
);
--> statement-breakpoint
CREATE TABLE "friend_request" (
	"lower_id" text NOT NULL,
	"higher_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_request_pair_pk" PRIMARY KEY("lower_id","higher_id"),
	CONSTRAINT "friend_request_pair_order_chk" CHECK ("friend_request"."lower_id" < "friend_request"."higher_id"),
	CONSTRAINT "friend_request_requester_chk" CHECK ("friend_request"."requester_id" = "friend_request"."lower_id" or "friend_request"."requester_id" = "friend_request"."higher_id")
);
--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_lower_id_visitor_profile_account_id_fk" FOREIGN KEY ("lower_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_higher_id_visitor_profile_account_id_fk" FOREIGN KEY ("higher_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_lower_id_visitor_profile_account_id_fk" FOREIGN KEY ("lower_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_higher_id_visitor_profile_account_id_fk" FOREIGN KEY ("higher_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_requester_id_visitor_profile_account_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;