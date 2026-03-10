"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function req(v, key) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && isNaN(v))) {
        throw new Error(`Missing required config: ${key}`);
    }
    return v;
}
class Config {
    server;
    jwt;
    database;
    aws;
    constructor(raw) {
        this.server = {
            host: raw.server?.host,
            port: raw.server?.port,
            logging: {
                level: raw.server?.logging?.level
            }
        };
        this.jwt = {
            ttl: raw.jwt?.ttl,
            secretKey: raw.jwt?.secret_key
        };
        this.database = {
            sql: {
                host: raw.database?.sql?.host,
                port: raw.database?.sql?.port,
                user: raw.database?.sql?.user,
                password: raw.database?.sql?.password,
                name: raw.database?.sql?.name
            }
        };
        this.aws = {
            region: raw.aws?.region,
            access_key_id: raw.aws?.access_key_id,
            secret_access_key: raw.aws?.secret_access_key,
            bucket_name: raw.aws?.bucket_name,
            public_base: raw.aws?.public_base
        };
        this.server.host = req(this.server.host, "server.host");
        this.server.port = req(this.server.port, "server.port");
        this.server.logging.level = req(this.server.logging.level, "server.logging.level");
        this.jwt.ttl = req(this.jwt.ttl, "jwt.ttl");
        this.jwt.secretKey = req(this.jwt.secretKey, "jwt.secret_key");
        this.database.sql.host = req(this.database.sql.host, "database.sql.host");
        this.database.sql.port = req(this.database.sql.port, "database.sql.port");
        this.database.sql.user = req(this.database.sql.user, "database.sql.user");
        this.database.sql.password = req(this.database.sql.password, "database.sql.password");
        this.database.sql.name = req(this.database.sql.name, "database.sql.name");
        this.aws.region = req(this.aws.region, "aws.region");
        this.aws.access_key_id = req(this.aws.access_key_id, "aws.access_key_id");
        this.aws.secret_access_key = req(this.aws.secret_access_key, "aws.secret_access_key");
        this.aws.bucket_name = req(this.aws.bucket_name, "aws.bucket_name");
        this.aws.public_base = req(this.aws.public_base, "aws.public_base");
    }
    static load() {
        const filePath = process.env.KV_VIPER_FILE;
        if (!filePath) {
            console.error("[FATAL] 'KV_VIPER_FILE' is null.");
            process.exit(1);
        }
        const absPath = path_1.default.isAbsolute(filePath)
            ? filePath
            : path_1.default.resolve(process.cwd(), filePath);
        const text = fs_1.default.readFileSync(absPath, "utf8");
        const raw = js_yaml_1.default.load(text);
        return new Config(raw);
    }
}
const config = Config.load();
exports.default = config;
//# sourceMappingURL=config.js.map