"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./utils/logger"));
const router_1 = __importDefault(require("./api/router"));
const error_1 = __importDefault(require("./api/middlewares/error"));
const config_1 = __importDefault(require("./utils/config"));
class App {
    expressApp;
    port;
    constructor() {
        this.port = config_1.default.server.port;
        this.expressApp = (0, express_1.default)();
        this.expressApp.use(express_1.default.json());
        this.expressApp.use(express_1.default.urlencoded({ extended: true }));
        this.expressApp.use("/api/v1", router_1.default);
        this.expressApp.use(error_1.default);
    }
    async run() {
        return new Promise((resolve) => {
            this.expressApp.listen(this.port, () => {
                logger_1.default.info(`Server is running on port ${this.port}`);
                resolve();
            });
        });
    }
}
const app = new App();
exports.default = app;
//# sourceMappingURL=app.js.map