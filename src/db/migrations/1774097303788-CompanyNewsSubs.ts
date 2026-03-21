import { MigrationInterface, QueryRunner } from "typeorm";

export class CompanyNewsSubs1774097303788 implements MigrationInterface {
    name = "CompanyNewsSubs1774097303788";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "news" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "company_subs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "company_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4a5c967ff18b632f29f50980d5d" UNIQUE ("account_id", "company_id"), CONSTRAINT "PK_a4cf24216554d3427975e3dd660" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "news" ADD CONSTRAINT "FK_7cdd3524a000b1cde5683fc80bf" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" ADD CONSTRAINT "FK_ece429f1012a38a838559c92201" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" ADD CONSTRAINT "FK_a67e364fb4be86ddedfddd11305" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "company_subs" DROP CONSTRAINT "FK_a67e364fb4be86ddedfddd11305"`
        );
        await queryRunner.query(
            `ALTER TABLE "company_subs" DROP CONSTRAINT "FK_ece429f1012a38a838559c92201"`
        );
        await queryRunner.query(
            `ALTER TABLE "news" DROP CONSTRAINT "FK_7cdd3524a000b1cde5683fc80bf"`
        );
        await queryRunner.query(`DROP TABLE "company_subs"`);
        await queryRunner.query(`DROP TABLE "news"`);
    }
}
