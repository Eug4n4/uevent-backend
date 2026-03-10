import { MigrationInterface, QueryRunner } from "typeorm";
export default class Init1748000000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
