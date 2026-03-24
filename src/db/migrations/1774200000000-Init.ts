import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774200000000 implements MigrationInterface {
    name = "Init1774200000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ENUMs
        await queryRunner.query(
            `CREATE TYPE "public"."account_roles" AS ENUM('admin', 'user')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."company_roles" AS ENUM('owner', 'admin', 'moder')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."formats" AS ENUM('lection', 'confertion', 'meating')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."visitors_visibility" AS ENUM('all', 'staff_only', 'visitors_only')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'paid', 'canceled', 'returned')`
        );

        // Tables
        await queryRunner.query(
            `CREATE TABLE "accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "role" "public"."account_roles" NOT NULL DEFAULT 'user',
                "password" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_accounts_email" UNIQUE ("email"),
                CONSTRAINT "PK_accounts" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "profiles" (
                "account_id" uuid NOT NULL,
                "username" character varying NOT NULL,
                "pseudonym" character varying,
                "avatar_key" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_profiles_username" UNIQUE ("username"),
                CONSTRAINT "PK_profiles" PRIMARY KEY ("account_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "companies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "address" character varying(255) NOT NULL,
                "avatar_key" character varying(255),
                "banner_key" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_companies_email" UNIQUE ("email"),
                CONSTRAINT "PK_companies" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "company_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "account_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "role" "public"."company_roles" NOT NULL DEFAULT 'moder',
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_company_members" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "company_billings" (
                "company_id" uuid NOT NULL,
                "stripe_account_id" character varying,
                "stripe_onboarded" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_company_billings" PRIMARY KEY ("company_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "company_subs" (
                "account_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_company_subs" PRIMARY KEY ("account_id", "company_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "news" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "text" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_news" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "tags" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" character varying(255),
                "icon_key" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tags" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "format" "public"."formats" NOT NULL,
                "visiability" "public"."visitors_visibility" NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" character varying(1024),
                "text" character varying NOT NULL,
                "avatar_key" character varying,
                "banner_key" character varying,
                "notification_new_ticket" boolean NOT NULL DEFAULT false,
                "publish_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_events" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "event_locations" (
                "event_id" uuid NOT NULL,
                "address" character varying,
                "location" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_event_locations" PRIMARY KEY ("event_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "event_tags" (
                "event_id" uuid NOT NULL,
                "tag_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_event_tags" PRIMARY KEY ("event_id", "tag_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "event_subs" (
                "account_id" uuid NOT NULL,
                "event_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_event_subs" PRIMARY KEY ("account_id", "event_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "event_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "account_id" uuid NOT NULL,
                "parent_id" uuid,
                "text" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_event_comments" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "tickets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" character varying(255),
                "price" double precision NOT NULL CHECK (price >= 0),
                "currency" character varying(3) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_tickets" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "tickets_stats" (
                "ticket_id" uuid NOT NULL,
                "total" integer NOT NULL CHECK (total > 0),
                "sold" integer NOT NULL CHECK (sold >= 0),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tickets_stats" PRIMARY KEY ("ticket_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "promo_codes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "ticket_id" uuid NOT NULL,
                "code" character varying(50) NOT NULL,
                "discount_percent" integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_promo_codes_code" UNIQUE ("code"),
                CONSTRAINT "PK_promo_codes" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "promo_code_stats" (
                "code_id" uuid NOT NULL,
                "total" integer NOT NULL CHECK (total > 0),
                "used" integer NOT NULL CHECK (used >= 0),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_promo_code_stats" PRIMARY KEY ("code_id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "user_tickets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "account_id" uuid NOT NULL,
                "ticket_id" uuid NOT NULL,
                "promo_code_id" uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_tickets" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `CREATE TABLE "transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_ticket_id" uuid NOT NULL,
                "payment_intent_id" character varying,
                "status" "public"."transaction_status" NOT NULL DEFAULT 'pending',
                "final_price" integer NOT NULL,
                "currency" character varying(3) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
            )`
        );

        // Foreign keys
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "company_members" ADD CONSTRAINT "FK_company_member_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "company_members" ADD CONSTRAINT "FK_company_member_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "company_billings" ADD CONSTRAINT "FK_company_billing_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" ADD CONSTRAINT "FK_company_subs_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" ADD CONSTRAINT "FK_company_subs_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "news" ADD CONSTRAINT "FK_news_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD CONSTRAINT "FK_events_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_locations" ADD CONSTRAINT "FK_event_location_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_event_tags_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_event_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" ADD CONSTRAINT "FK_event_subs_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" ADD CONSTRAINT "FK_event_subs_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "event_comments"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "tickets_stats" ADD CONSTRAINT "FK_tickets_stats_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "promo_codes" ADD CONSTRAINT "FK_promo_codes_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "promo_code_stats" ADD CONSTRAINT "FK_promo_code_stats_code_id" FOREIGN KEY ("code_id") REFERENCES "promo_codes"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" ADD CONSTRAINT "FK_user_tickets_promo_code_id" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" ADD CONSTRAINT "FK_user_tickets_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" ADD CONSTRAINT "FK_user_tickets_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_user_ticket_id" FOREIGN KEY ("user_ticket_id") REFERENCES "user_tickets"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_user_ticket_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" DROP CONSTRAINT "FK_user_tickets_ticket_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" DROP CONSTRAINT "FK_user_tickets_account_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_tickets" DROP CONSTRAINT "FK_user_tickets_promo_code_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "promo_code_stats" DROP CONSTRAINT "FK_promo_code_stats_code_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "promo_codes" DROP CONSTRAINT "FK_promo_codes_ticket_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "tickets_stats" DROP CONSTRAINT "FK_tickets_stats_ticket_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_event_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_event_comments_parent_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_event_comments_account_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_event_comments_event_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" DROP CONSTRAINT "FK_event_subs_account_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" DROP CONSTRAINT "FK_event_subs_event_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_event_tags_tag_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_event_tags_event_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_locations" DROP CONSTRAINT "FK_event_location_event_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP CONSTRAINT "FK_events_company_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "news" DROP CONSTRAINT "FK_news_company_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" DROP CONSTRAINT "FK_company_subs_account_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" DROP CONSTRAINT "FK_company_subs_company_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_billings" DROP CONSTRAINT "FK_company_billing_company_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_members" DROP CONSTRAINT "FK_company_member_company_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_members" DROP CONSTRAINT "FK_company_member_account_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_account_id"`
        );

        // Drop tables (reverse dependency order)
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "user_tickets"`);
        await queryRunner.query(`DROP TABLE "promo_code_stats"`);
        await queryRunner.query(`DROP TABLE "promo_codes"`);
        await queryRunner.query(`DROP TABLE "tickets_stats"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TABLE "event_comments"`);
        await queryRunner.query(`DROP TABLE "event_subs"`);
        await queryRunner.query(`DROP TABLE "event_tags"`);
        await queryRunner.query(`DROP TABLE "event_locations"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "news"`);
        await queryRunner.query(`DROP TABLE "company_subs"`);
        await queryRunner.query(`DROP TABLE "company_billings"`);
        await queryRunner.query(`DROP TABLE "company_members"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "accounts"`);

        // Drop ENUMs
        await queryRunner.query(`DROP TYPE "public"."transaction_status"`);
        await queryRunner.query(`DROP TYPE "public"."visitors_visibility"`);
        await queryRunner.query(`DROP TYPE "public"."formats"`);
        await queryRunner.query(`DROP TYPE "public"."company_roles"`);
        await queryRunner.query(`DROP TYPE "public"."account_roles"`);
    }
}
