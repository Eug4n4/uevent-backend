"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = __importDefault(require("./config"));
class Migrator {
    dataSource;
    constructor() {
        this.dataSource = new typeorm_1.DataSource({
            type: "postgres",
            host: config_1.default.database.sql.host,
            port: config_1.default.database.sql.port,
            username: config_1.default.database.sql.user,
            password: config_1.default.database.sql.password,
            database: config_1.default.database.sql.name,
            migrations: ["assets/migrations/*.ts"],
            synchronize: false
        });
    }
    async up() {
        await this.dataSource.initialize();
        await this.dataSource.runMigrations();
        await this.dataSource.destroy();
    }
    async down() {
        await this.dataSource.initialize();
        await this.dataSource.undoLastMigration();
        await this.dataSource.destroy();
    }
}
const migrator = new Migrator();
exports.default = migrator;
//# sourceMappingURL=migrations.js.map