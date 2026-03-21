import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773868658931 implements MigrationInterface {
    name = "Init1773868658931";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."accounts_role_enum" AS ENUM('admin', 'user')`
        );
        await queryRunner.query(
            `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(256) NOT NULL, "password" character varying(256), "role" "public"."accounts_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "profiles" ("account_id" uuid NOT NULL, "username" character varying(30) NOT NULL, "avatar" character varying(255) NOT NULL DEFAULT 'default.png', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48f07a756b8f321aa99b06aee11" PRIMARY KEY ("account_id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "address" character varying(255) NOT NULL, "avatar" character varying(255) NOT NULL DEFAULT 'default.png', "banner" character varying(255) NOT NULL DEFAULT 'default.png', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_d0af6f5866201d5cb424767744a" UNIQUE ("email"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."events_format_enum" AS ENUM('Lection', 'Workshop', 'Concert', 'Meeting')`
        );
        await queryRunner.query(
            `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, "avatar" character varying(255) NOT NULL DEFAULT 'default.png', "banner" character varying(255) NOT NULL DEFAULT 'default.png', "format" "public"."events_format_enum" NOT NULL, "notification_new_ticket" boolean NOT NULL DEFAULT false, "publish_at" TIMESTAMP NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "event_tags" ("event_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_0fce1d3dc22d5c2b86d8eb3c035" PRIMARY KEY ("event_id", "tag_id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_640b9db5340d03f53d02a4dca1" ON "event_tags" ("event_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_f80b6bfb86895b578c3083a2e8" ON "event_tags" ("tag_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD CONSTRAINT "FK_48f07a756b8f321aa99b06aee11" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD CONSTRAINT "FK_df63e1563bbd91b428b5c50d8ad" FOREIGN KEY ("owner_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD CONSTRAINT "FK_b97c36be0cf65565fad88588c28" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_640b9db5340d03f53d02a4dca1d" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_f80b6bfb86895b578c3083a2e8c" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_f80b6bfb86895b578c3083a2e8c"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_640b9db5340d03f53d02a4dca1d"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP CONSTRAINT "FK_b97c36be0cf65565fad88588c28"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP CONSTRAINT "FK_df63e1563bbd91b428b5c50d8ad"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP CONSTRAINT "FK_48f07a756b8f321aa99b06aee11"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_f80b6bfb86895b578c3083a2e8"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_640b9db5340d03f53d02a4dca1"`
        );
        await queryRunner.query(`DROP TABLE "event_tags"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_format_enum"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_role_enum"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }
}
