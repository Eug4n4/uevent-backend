"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorRenderer;
const zod_1 = require("zod");
const errors_1 = require("../errors");
function errorRenderer(err, req, res, next) {
    if (err instanceof zod_1.ZodError) {
        const details = zod_1.z.treeifyError(err);
        const e = new errors_1.BadRequest("Validation failed", details);
        return res.status(e.status).json({
            error: e.code,
            message: e.message,
            details: e.details,
        });
    }
    if (err instanceof errors_1.HttpError) {
        return res.status(err.status).json({
            error: err.code,
            message: err.message,
            details: err.details,
        });
    }
    console.error("Unexpected error:", err);
    const e = new errors_1.Internal();
    return res.status(e.status).json({
        error: e.code,
        message: e.message,
    });
}
//# sourceMappingURL=error.js.map