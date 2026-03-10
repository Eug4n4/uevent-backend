"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./utils/logger"));
const migrations_1 = __importDefault(require("./utils/migrations"));
class Cli {
    static async Run(args = []) {
        const [command, subcommand] = args;
        switch (`${command} ${subcommand || ""}`.trim()) {
            case "migrate up":
                logger_1.default.info("Starting migrations: up");
                await migrations_1.default.up();
                logger_1.default.info("Migrations up completed.");
                break;
            case "migrate down":
                logger_1.default.info("Starting migrations: down");
                await migrations_1.default.down();
                logger_1.default.info("Migrations down completed.");
                break;
            case "service run": {
                logger_1.default.info("Service is running. Press Ctrl+C to stop.");
                await app_1.default.run();
                return true;
            }
            default:
                logger_1.default.error(`Unknown command: ${args.join(" ")}`);
                logger_1.default.error(`Usage:
                    \t node index.js service run \n
                    \t node index.js migrate up \n
                    \t node index.js migrate down \n`);
                return false;
        }
        return true;
    }
}
exports.default = Cli;
//# sourceMappingURL=cli.js.map