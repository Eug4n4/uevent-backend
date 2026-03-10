import { MigrationInterface, QueryRunner } from "typeorm";

export default class Init1748000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "account_roles" AS ENUM ('admin', 'user');
            CREATE TYPE "formats" AS ENUM ('lection', 'confertion', 'meating');
            CREATE TYPE "visitors_visibility" AS ENUM ('all', 'staff_only', 'visitors_only');
            CREATE TYPE "visitor_type" AS ENUM ('staff', 'visitor');
            CREATE TYPE "transaction_status" AS ENUM ('pending', 'paid', 'canceled', 'returned');
        `);

        await queryRunner.query(`
            CREATE TABLE "users" (
                "id"         UUID PRIMARY KEY,
                "email"      varchar UNIQUE NOT NULL,
                "role"       account_roles NOT NULL DEFAULT 'user',
                "password"   varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "profiles" (
                "user_id"    UUID PRIMARY KEY REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "username"   varchar UNIQUE NOT NULL,
                "pseudonym"  varchar,
                "avatar_key" varchar(255),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id"         UUID PRIMARY KEY,
                "name"       varchar(255) NOT NULL,
                "email"      varchar(255) UNIQUE NOT NULL,
                "address"    varchar(255) NOT NULL,
                "avatar_key" varchar(255),
                "banner_key" varchar(255),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "company_billing" (
                "company_id"        UUID PRIMARY KEY REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "stripe_account_id" varchar,
                "stripe_onboarded"  bool NOT NULL DEFAULT false,
                "created_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "company_members" (
                "id"         UUID PRIMARY KEY,
                "user_id"    UUID NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "company_id" UUID NOT NULL REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "head"       bool NOT NULL DEFAULT false,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "company_subs" (
                "user_id"    UUID REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "company_id" UUID REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("user_id", "company_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "news" (
                "id"         UUID PRIMARY KEY,
                "company_id" UUID NOT NULL REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "name"       varchar(255) NOT NULL,
                "text"       varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tags" (
                "id"          UUID PRIMARY KEY,
                "name"        varchar(255) NOT NULL,
                "description" varchar(255),
                "icon_key"    varchar(255),
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "events" (
                "id"                      UUID PRIMARY KEY,
                "company_id"              UUID NOT NULL REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "formats"                 formats NOT NULL,
                "visiability"             visitors_visibility NOT NULL,
                "title"                   varchar(255) NOT NULL,
                "text"                    varchar NOT NULL,
                "avatar_key"              varchar,
                "banner_key"              varchar,
                "notification_new_ticket" bool NOT NULL DEFAULT false,
                "publish_at"              TIMESTAMPTZ NOT NULL,
                "start_at"                TIMESTAMPTZ NOT NULL,
                "end_at"                  TIMESTAMPTZ NOT NULL,
                "created_at"              TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"              TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_location" (
                "event_id"   UUID PRIMARY KEY REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "address"    varchar,
                "location"   varchar,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_tags" (
                "event_id"   UUID REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "tag_id"     UUID REFERENCES "tags" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("event_id", "tag_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_subs" (
                "user_id"    UUID REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "event_id"   UUID REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                PRIMARY KEY ("user_id", "event_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_comments" (
                "id"         UUID PRIMARY KEY,
                "event_id"   UUID NOT NULL REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "user_id"    UUID NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "parent_id"  UUID REFERENCES "event_comments" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "text"       varchar NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at" TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_visitors" (
                "id"           UUID PRIMARY KEY,
                "event_id"     UUID NOT NULL REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "user_id"      UUID NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "visitor_type" visitor_type DEFAULT 'visitor',
                "created_at"   TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"   TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tickets" (
                "id"          UUID PRIMARY KEY,
                "event_id"    UUID NOT NULL REFERENCES "events" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "name"        varchar(255) NOT NULL,
                "description" varchar(255),
                "price"       float NOT NULL CHECK (price >= 0),
                "currency"    varchar(3) NOT NULL,
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"  TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tickets_stats" (
                "ticket_id"  UUID PRIMARY KEY REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "total"      int NOT NULL CHECK (total > 0),
                "sold"       int NOT NULL CHECK (sold >= 0),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "promo_codes" (
                "id"               UUID PRIMARY KEY,
                "ticket_id"        UUID NOT NULL REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "code"             varchar(50) UNIQUE NOT NULL,
                "discount_percent" int NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
                "created_at"       TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "deleted_at"       TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "promo_code_stats" (
                "code_id"    UUID PRIMARY KEY REFERENCES "promo_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "total"      int NOT NULL CHECK (total > 0),
                "used"       int NOT NULL CHECK (used >= 0),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_tickets" (
                "id"            UUID PRIMARY KEY,
                "user_id"       UUID NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "ticket_id"     UUID NOT NULL REFERENCES "tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "promo_code_id" UUID REFERENCES "promo_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "created_at"    TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id"                UUID PRIMARY KEY,
                "user_ticket_id"    UUID NOT NULL REFERENCES "user_tickets" ("id") DEFERRABLE INITIALLY IMMEDIATE,
                "payment_intent_id" varchar,
                "status"            transaction_status NOT NULL DEFAULT 'pending',
                "final_price"       int NOT NULL,
                "currency"          varchar(3) NOT NULL,
                "created_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
                "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_tickets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "promo_code_stats"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "promo_codes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tickets_stats"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_visitors"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_comments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_subs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_tags"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_location"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "news"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_subs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_members"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_billing"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

        await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "visitor_type"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "visitors_visibility"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "formats"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "account_roles"`);
    }
}
