import type { Request, Response, NextFunction } from "express";
export default function errorRenderer(err: unknown, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
