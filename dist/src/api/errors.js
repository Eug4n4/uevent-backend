"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedMediaType = exports.PayloadTooLarge = exports.MethodNotAllowed = exports.Internal = exports.Conflict = exports.NotFound = exports.Forbidden = exports.Unauthorized = exports.BadRequest = exports.HttpError = void 0;
class HttpError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.HttpError = HttpError;
class BadRequest extends HttpError {
    constructor(message = "Bad request", details) {
        super(400, "BAD_REQUEST", message, details);
    }
}
exports.BadRequest = BadRequest;
class Unauthorized extends HttpError {
    constructor(message = "Unauthorized", details) {
        super(401, "UNAUTHORIZED", message, details);
    }
}
exports.Unauthorized = Unauthorized;
class Forbidden extends HttpError {
    constructor(message = "Forbidden", details) {
        super(403, "FORBIDDEN", message, details);
    }
}
exports.Forbidden = Forbidden;
class NotFound extends HttpError {
    constructor(resource = "Resource", details) {
        super(404, "NOT_FOUND", `${resource} not found`, details);
    }
}
exports.NotFound = NotFound;
class Conflict extends HttpError {
    constructor(message = "Conflict", details) {
        super(409, "CONFLICT", message, details);
    }
}
exports.Conflict = Conflict;
class Internal extends HttpError {
    constructor(message = "Internal server error", details) {
        super(500, "INTERNAL", message, details);
    }
}
exports.Internal = Internal;
class MethodNotAllowed extends HttpError {
    constructor(message = "Method not allowed", details) {
        super(405, "METHOD_NOT_ALLOWED", message, details);
    }
}
exports.MethodNotAllowed = MethodNotAllowed;
class PayloadTooLarge extends HttpError {
    constructor(message = "Payload too large", details) {
        super(413, "PAYLOAD_TOO_LARGE", message, details);
    }
}
exports.PayloadTooLarge = PayloadTooLarge;
class UnsupportedMediaType extends HttpError {
    constructor(message = "Unsupported media type", details) {
        super(415, "UNPROCESSABLE", message, details);
    }
}
exports.UnsupportedMediaType = UnsupportedMediaType;
//# sourceMappingURL=errors.js.map