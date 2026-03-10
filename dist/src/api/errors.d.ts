export type ErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNPROCESSABLE" | "TOO_MANY_REQUESTS" | "INTERNAL" | "METHOD_NOT_ALLOWED" | "PAYLOAD_TOO_LARGE";
export declare class HttpError extends Error {
    readonly status: number;
    readonly code: ErrorCode;
    readonly details?: unknown;
    constructor(status: number, code: ErrorCode, message: string, details?: unknown);
}
export declare class BadRequest extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class Unauthorized extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class Forbidden extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class NotFound extends HttpError {
    constructor(resource?: string, details?: unknown);
}
export declare class Conflict extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class Internal extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class MethodNotAllowed extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class PayloadTooLarge extends HttpError {
    constructor(message?: string, details?: unknown);
}
export declare class UnsupportedMediaType extends HttpError {
    constructor(message?: string, details?: unknown);
}
