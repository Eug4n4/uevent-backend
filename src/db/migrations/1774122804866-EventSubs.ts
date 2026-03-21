import { MigrationInterface, QueryRunner } from "typeorm";

export class EventSubs1774122804866 implements MigrationInterface {
    name = "EventSubs1774122804866";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "event_subs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "event_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f114c81bae80a07ec71e76a752d" UNIQUE ("account_id", "event_id"), CONSTRAINT "PK_196a6393ae3d74a6dc9506b7eb0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" ADD CONSTRAINT "FK_090c4e65b302a09e68705691251" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" ADD CONSTRAINT "FK_e02a71f2d613c91498f75833295" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "event_subs" DROP CONSTRAINT "FK_e02a71f2d613c91498f75833295"`
        );
        await queryRunner.query(
            `ALTER TABLE "event_subs" DROP CONSTRAINT "FK_090c4e65b302a09e68705691251"`
        );
        await queryRunner.query(`DROP TABLE "event_subs"`);
    }
}
