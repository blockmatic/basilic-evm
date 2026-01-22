CREATE TABLE "wallet_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chain" text NOT NULL,
	"address" text NOT NULL,
	"wallet_provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_chain_address_unique" UNIQUE("chain","address")
);
--> statement-breakpoint
ALTER TABLE "wallet_identities" ADD CONSTRAINT "wallet_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_user_id_idx" ON "wallet_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "wallet_identities" USING btree ("address");