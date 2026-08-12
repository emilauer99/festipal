-- CR-01 (07-REVIEW.md): pin BOTH pair-ordering CHECKs to byte order.
--
-- `canonicalPair` sorts in JavaScript (UTF-16 code units, so 'B' < 'a'); these
-- CHECKs compared under the database's default collation, which is en_US.utf8
-- on the local dev Postgres and there 'B' < 'a' is false. For mixed-case
-- better-auth ids the two orders contradict each other and a correctly ordered
-- pair is rejected with SQLSTATE 23514 — a 500 on POST /me/friend-requests.
-- `COLLATE "C"` is byte order, which for the ASCII id charset is exactly
-- JavaScript's order.
--
-- Re-validating existing rows is safe by construction: every row in these two
-- tables was written through `canonicalPair`, i.e. already in JS/byte order.
ALTER TABLE "friendship" DROP CONSTRAINT "friendship_pair_order_chk";--> statement-breakpoint
ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_pair_order_chk";--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_pair_order_chk" CHECK ("friendship"."lower_id" collate "C" < "friendship"."higher_id" collate "C");--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_pair_order_chk" CHECK ("friend_request"."lower_id" collate "C" < "friend_request"."higher_id" collate "C");