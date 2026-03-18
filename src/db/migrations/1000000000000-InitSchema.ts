import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1000000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "account_roles" AS ENUM ('admin', 'user');
        `);

        await queryRunner.query(`
            CREATE TYPE "formats" AS ENUM ('lection', 'confertion', 'meating');
        `);

        await queryRunner.query(`
            CREATE TYPE "visitors_visibility" AS ENUM ('all', 'staff_only', 'visitors_only');
        `);

        await queryRunner.query(`
            CREATE TYPE "transaction_status" AS ENUM ('pending', 'paid', 'canceled', 'returned');
        `);

        await queryRunner.query(`
            CREATE TABLE "accounts" (
                "id"         UUID PRIMARY KEY,
                "email"      varchar UNIQUE NOT NULL,
                "role"       account_roles NOT NULL DEFAULT 'user',
                "password"   varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "profiles" (
                "account_id" uuid PRIMARY KEY,
                "username"   varchar UNIQUE NOT NULL,
                "pseudonym"  varchar,
                "avatar_key" varchar(255),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id"         UUID PRIMARY KEY,
                "owner_id"   uuid NOT NULL,
                "name"       varchar(255) NOT NULL,
                "email"      varchar(255) UNIQUE NOT NULL,
                "address"    varchar(255) NOT NULL,
                "avatar_key" varchar(255),
                "banner_key" varchar(255),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "company_billing" (
                "company_id"        UUID PRIMARY KEY,
                "stripe_account_id" varchar,
                "stripe_onboarded"  bool NOT NULL DEFAULT false,
                "created_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "company_subs" (
                "account_id" UUID,
                "company_id" UUID,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("account_id", "company_id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "news" (
                "id"         UUID PRIMARY KEY,
                "company_id" UUID NOT NULL,
                "name"       varchar(255) NOT NULL,
                "text"       varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "tags" (
                "id"          UUID PRIMARY KEY,
                "name"        varchar(255) NOT NULL,
                "description" varchar(255),
                "icon_key"    varchar(255),
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "events" (
                "id"                     UUID PRIMARY KEY,
                "company_id"             UUID NOT NULL,
                "formats"                formats NOT NULL,
                "visiability"            visitors_visibility NOT NULL,
                "title"                  varchar(255) NOT NULL,
                "text"                   varchar NOT NULL,
                "avatar_key"             varchar,
                "banner_key"             varchar,
                "notification_new_ticket" bool NOT NULL DEFAULT false,
                "publish_at"             TIMESTAMPTZ NOT NULL,
                "start_at"               TIMESTAMPTZ NOT NULL,
                "end_at"                 TIMESTAMPTZ NOT NULL,
                "created_at"             TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"             TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "event_location" (
                "event_id"   UUID PRIMARY KEY,
                "address"    varchar,
                "location"   varchar,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "event_tags" (
                "event_id"   UUID,
                "tag_id"     UUID,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("event_id", "tag_id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "event_subs" (
                "account_id" UUID,
                "event_id"   UUID,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("account_id", "event_id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "event_comments" (
                "id"         UUID PRIMARY KEY,
                "event_id"   UUID NOT NULL,
                "account_id" UUID NOT NULL,
                "parent_id"  UUID,
                "text"       varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "tickets" (
                "id"          UUID PRIMARY KEY,
                "event_id"    UUID NOT NULL,
                "name"        varchar(255) NOT NULL,
                "description" varchar(255),
                "price"       float NOT NULL CHECK (price >= 0),
                "currency"    varchar(3) NOT NULL,
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"  TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "tickets_stats" (
                "ticket_id"  UUID PRIMARY KEY,
                "total"      int NOT NULL CHECK (total > 0),
                "sold"       int NOT NULL CHECK (sold >= 0),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "promo_codes" (
                "id"               UUID PRIMARY KEY,
                "ticket_id"        UUID NOT NULL,
                "code"             varchar(50) UNIQUE NOT NULL,
                "discount_percent" int NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
                "created_at"       TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"       TIMESTAMPTZ
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "promo_code_stats" (
                "code_id"    UUID PRIMARY KEY,
                "total"      int NOT NULL CHECK (total > 0),
                "used"       int NOT NULL CHECK (used >= 0),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "user_tickets" (
                "id"            UUID PRIMARY KEY,
                "account_id"    UUID NOT NULL,
                "ticket_id"     UUID NOT NULL,
                "promo_code_id" UUID,
                "created_at"    TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id"                UUID PRIMARY KEY,
                "user_ticket_id"    UUID NOT NULL,
                "payment_intent_id" varchar,
                "status"            transaction_status NOT NULL DEFAULT 'pending',
                "final_price"       int NOT NULL,
                "currency"          varchar(3) NOT NULL,
                "created_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            );
        `);

        // Foreign keys
        await queryRunner.query(`
            ALTER TABLE "profiles"
                ADD CONSTRAINT "fk_profiles_account_id"
                FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "companies"
                ADD CONSTRAINT "fk_companies_owner_id"
                FOREIGN KEY ("owner_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "company_billing"
                ADD CONSTRAINT "fk_company_billing_company_id"
                FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "company_subs"
                ADD CONSTRAINT "fk_company_subs_company_id"
                FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "company_subs"
                ADD CONSTRAINT "fk_company_subs_account_id"
                FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "news"
                ADD CONSTRAINT "fk_news_company_id"
                FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "events"
                ADD CONSTRAINT "fk_events_company_id"
                FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_location"
                ADD CONSTRAINT "fk_event_location_event_id"
                FOREIGN KEY ("event_id") REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_tags"
                ADD CONSTRAINT "fk_event_tags_event_id"
                FOREIGN KEY ("event_id") REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_tags"
                ADD CONSTRAINT "fk_event_tags_tag_id"
                FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_subs"
                ADD CONSTRAINT "fk_event_subs_event_id"
                FOREIGN KEY ("event_id") REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_subs"
                ADD CONSTRAINT "fk_event_subs_account_id"
                FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_comments"
                ADD CONSTRAINT "fk_event_comments_event_id"
                FOREIGN KEY ("event_id") REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_comments"
                ADD CONSTRAINT "fk_event_comments_account_id"
                FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "event_comments"
                ADD CONSTRAINT "fk_event_comments_parent_id"
                FOREIGN KEY ("parent_id") REFERENCES "event_comments" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "tickets"
                ADD CONSTRAINT "fk_tickets_event_id"
                FOREIGN KEY ("event_id") REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "tickets_stats"
                ADD CONSTRAINT "fk_tickets_stats_ticket_id"
                FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "promo_codes"
                ADD CONSTRAINT "fk_promo_codes_ticket_id"
                FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "promo_code_stats"
                ADD CONSTRAINT "fk_promo_code_stats_code_id"
                FOREIGN KEY ("code_id") REFERENCES "promo_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "user_tickets"
                ADD CONSTRAINT "fk_user_tickets_promo_code_id"
                FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "user_tickets"
                ADD CONSTRAINT "fk_user_tickets_account_id"
                FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "user_tickets"
                ADD CONSTRAINT "fk_user_tickets_ticket_id"
                FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions"
                ADD CONSTRAINT "fk_transactions_user_ticket_id"
                FOREIGN KEY ("user_ticket_id") REFERENCES "user_tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "fk_transactions_user_ticket_id"`);

        await queryRunner.query(`ALTER TABLE "user_tickets" DROP CONSTRAINT "fk_user_tickets_ticket_id"`);
        await queryRunner.query(`ALTER TABLE "user_tickets" DROP CONSTRAINT "fk_user_tickets_account_id"`);
        await queryRunner.query(`ALTER TABLE "user_tickets" DROP CONSTRAINT "fk_user_tickets_promo_code_id"`);

        await queryRunner.query(`ALTER TABLE "promo_code_stats" DROP CONSTRAINT "fk_promo_code_stats_code_id"`);
        await queryRunner.query(`ALTER TABLE "promo_codes" DROP CONSTRAINT "fk_promo_codes_ticket_id"`);
        await queryRunner.query(`ALTER TABLE "tickets_stats" DROP CONSTRAINT "fk_tickets_stats_ticket_id"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "fk_tickets_event_id"`);

        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT "fk_event_comments_parent_id"`);
        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT "fk_event_comments_account_id"`);
        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT "fk_event_comments_event_id"`);

        await queryRunner.query(`ALTER TABLE "event_subs" DROP CONSTRAINT "fk_event_subs_account_id"`);
        await queryRunner.query(`ALTER TABLE "event_subs" DROP CONSTRAINT "fk_event_subs_event_id"`);

        await queryRunner.query(`ALTER TABLE "event_tags" DROP CONSTRAINT "fk_event_tags_tag_id"`);
        await queryRunner.query(`ALTER TABLE "event_tags" DROP CONSTRAINT "fk_event_tags_event_id"`);

        await queryRunner.query(`ALTER TABLE "event_location" DROP CONSTRAINT "fk_event_location_event_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "fk_events_company_id"`);
        await queryRunner.query(`ALTER TABLE "news" DROP CONSTRAINT "fk_news_company_id"`);

        await queryRunner.query(`ALTER TABLE "company_subs" DROP CONSTRAINT "fk_company_subs_account_id"`);
        await queryRunner.query(`ALTER TABLE "company_subs" DROP CONSTRAINT "fk_company_subs_company_id"`);

        await queryRunner.query(`ALTER TABLE "company_billing" DROP CONSTRAINT "fk_company_billing_company_id"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "fk_companies_owner_id"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "fk_profiles_account_id"`);

        // Drop tables in reverse dependency order
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "user_tickets"`);
        await queryRunner.query(`DROP TABLE "promo_code_stats"`);
        await queryRunner.query(`DROP TABLE "promo_codes"`);
        await queryRunner.query(`DROP TABLE "tickets_stats"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TABLE "event_comments"`);
        await queryRunner.query(`DROP TABLE "event_subs"`);
        await queryRunner.query(`DROP TABLE "event_tags"`);
        await queryRunner.query(`DROP TABLE "event_location"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "news"`);
        await queryRunner.query(`DROP TABLE "company_subs"`);
        await queryRunner.query(`DROP TABLE "company_billing"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "accounts"`);

        // Drop types
        await queryRunner.query(`DROP TYPE "transaction_status"`);
        await queryRunner.query(`DROP TYPE "visitors_visibility"`);
        await queryRunner.query(`DROP TYPE "formats"`);
        await queryRunner.query(`DROP TYPE "account_roles"`);
    }
}
