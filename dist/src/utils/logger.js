"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const config_1 = __importDefault(require("./config"));
class Logger {
    logger;
    constructor(level) {
        this.logger = (0, winston_1.createLogger)({
            level,
            format: winston_1.format.combine(winston_1.format.colorize({ all: true }), winston_1.format.timestamp(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${timestamp}] [${level}] ${message}${metaStr ? ` ${metaStr}` : ''}`;
            })),
            transports: [new winston_1.transports.Console()],
        });
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    log(level, message, meta) {
        this.logger.log(level, message, meta);
    }
}
const log = (0, winston_1.createLogger)(config_1.default.server.logging);
exports.default = log;
//# sourceMappingURL=logger.js.map