"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_process_1 = require("node:process");
const cli_1 = __importDefault(require("./cli"));
async function main() {
    const args = node_process_1.argv.slice(2);
    const success = await cli_1.default.Run(args);
    if (!success) {
        console.error('Failed to start backend. Exiting.');
        (0, node_process_1.exit)(1);
    }
}
main().catch((err) => {
    if (err instanceof Error) {
        console.error('Unexpected error:', err.stack ?? err.message);
    }
    else {
        console.error('Unexpected error:', err);
    }
    (0, node_process_1.exit)(1);
});
//# sourceMappingURL=index.js.map