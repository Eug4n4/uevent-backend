import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";

import {BadRequest, HttpError, Internal} from "../errors";

export default function errorRenderer(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof ZodError) {
        const details = z.treeifyError(err);
        const e = new BadRequest("Validation failed", details);
        return res.status(e.status).json({
            error: e.code,
            message: e.message,
            details: e.details,
        });
    }

    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: err.code,
            message: err.message,
            details: err.details,
        });
    }

    console.error("Unexpected error:", err);
    const e = new Internal();
    return res.status(e.status).json({
        error: e.code,
        message: e.message,
    });
}