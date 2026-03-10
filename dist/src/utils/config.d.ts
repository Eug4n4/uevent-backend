interface RawConfig {
    server: {
        host: string;
        port: number;
        logging: {
            level: string;
            format: string;
        };
    };
    jwt: {
        secret_key: string;
        ttl: number;
    };
    database: {
        sql: {
            host: string;
            port: number;
            user: string;
            password: string;
            name: string;
        };
    };
    aws: {
        region: string;
        access_key_id: string;
        secret_access_key: string;
        bucket_name: string;
        public_base: string;
    };
}
declare class Config {
    server: {
        host: string;
        port: number;
        logging: {
            level: string;
        };
    };
    jwt: {
        secretKey: string;
        ttl: number;
    };
    database: {
        sql: {
            host: string;
            port: number;
            user: string;
            password: string;
            name: string;
        };
    };
    aws: {
        region: string;
        access_key_id: string;
        secret_access_key: string;
        bucket_name: string;
        public_base: string;
    };
    constructor(raw: RawConfig);
    static load(): Config;
}
declare const config: Config;
export default config;
