import { MigrationInterface, QueryRunner } from "typeorm";

export class TimestampWithTimeZone1774017062998 implements MigrationInterface {
    name = "TimestampWithTimeZone1774017062998";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "tags" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "tags" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "publish_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "publish_at" TIMESTAMP WITH TIME ZONE NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_at"`);
        await queryRunner.query(
            `ALTER TABLE "events" ADD "start_at" TIMESTAMP WITH TIME ZONE NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_at"`);
        await queryRunner.query(
            `ALTER TABLE "events" ADD "end_at" TIMESTAMP WITH TIME ZONE NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "deleted_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_at"`);
        await queryRunner.query(
            `ALTER TABLE "events" ADD "end_at" TIMESTAMP NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_at"`);
        await queryRunner.query(
            `ALTER TABLE "events" ADD "start_at" TIMESTAMP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "events" DROP COLUMN "publish_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "events" ADD "publish_at" TIMESTAMP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "deleted_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "companies" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "deleted_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP COLUMN "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "tags" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "tags" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
    }
}
