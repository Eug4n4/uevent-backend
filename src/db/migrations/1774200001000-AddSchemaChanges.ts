import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchemaChanges1774200001000 implements MigrationInterface {
    name = "AddSchemaChanges1774200001000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // companies: add location
        await queryRunner.query(
            `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326)`
        );

        // events: drop legacy avatar_key, add location, notification_new_tickets, visitors_visibility
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN IF EXISTS "avatar_key"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326)`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "notification_new_tickets" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."visitors_visibility_enum" AS ENUM('everyone', 'staff_only', 'staff_and_visitors')`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "visitors_visibility" "public"."visitors_visibility_enum" NOT NULL DEFAULT 'everyone'`
        );

        // event_comments: create table with materialized-path tree support
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "event_comments" (
                "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
                "text"       character varying(255) NOT NULL,
                "event_id"   uuid NOT NULL,
                "profile_id" uuid NOT NULL,
                "mpath"      character varying DEFAULT '',
                "parent_id"  uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_event_comments" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profiles"("account_id") DEFERRABLE INITIALLY IMMEDIATE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_event_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "event_comments"("id") DEFERRABLE INITIALLY IMMEDIATE`
        );

        // user_tickets: add visibility
        await queryRunner.query(
            `ALTER TABLE "user_tickets" ADD COLUMN IF NOT EXISTS "visibility" boolean NOT NULL DEFAULT true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user_tickets" DROP COLUMN IF EXISTS "visibility"`
        );

        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_parent_id"`);
        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_profile_id"`);
        await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_event_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_comments"`);

        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN IF EXISTS "visitors_visibility"`
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."visitors_visibility_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN IF EXISTS "notification_new_tickets"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN IF EXISTS "location"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "avatar_key" character varying(255)`
        );

        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN IF EXISTS "location"`
        );
    }
}
