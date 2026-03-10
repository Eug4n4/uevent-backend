import { DataSource } from "typeorm";

import config from "./config";

class Migrator {
    private dataSource: DataSource;

    constructor() {
        this.dataSource = new DataSource({
            type: "postgres",
            host: config.database.sql.host,
            port: config.database.sql.port,
            username: config.database.sql.user,
            password: config.database.sql.password,
            database: config.database.sql.name,
            // entities: ["src/**/*.entity.ts"],
            migrations: ["assets/migrations/*.ts"],
            synchronize: false
        });
    }

    async up(): Promise<void> {
        await this.dataSource.initialize();
        await this.dataSource.runMigrations();
        await this.dataSource.destroy();
    }

    async down(): Promise<void> {
        await this.dataSource.initialize();
        await this.dataSource.undoLastMigration();
        await this.dataSource.destroy();
    }
}

const migrator = new Migrator();
export default migrator;