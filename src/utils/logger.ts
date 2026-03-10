import { createLogger, format as winstonFormat, transports, Logger as WinstonLogger } from 'winston';
import config from "./config";

class Logger {
    private logger: WinstonLogger;

    constructor(level: string) {
        this.logger = createLogger({
            level,
            format: winstonFormat.combine(
                winstonFormat.colorize({ all: true }),
                winstonFormat.timestamp(),
                winstonFormat.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `[${timestamp}] [${level}] ${message}${metaStr ? ` ${metaStr}` : ''}`;
                })
            ),
            transports: [new transports.Console()],
        });
    }

    info(message: string, meta?: unknown): void {
        this.logger.info(message, meta);
    }

    warn(message: string, meta?: unknown): void {
        this.logger.warn(message, meta);
    }

    error(message: string, meta?: unknown): void {
        this.logger.error(message, meta);
    }

    debug(message: string, meta?: unknown): void {
        this.logger.debug(message, meta);
    }

    log(level: string, message: string, meta?: unknown): void {
        this.logger.log(level, message, meta);
    }
}

const log = createLogger(config.server.logging);
export default log;