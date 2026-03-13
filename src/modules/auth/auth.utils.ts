import { Request } from "express";
import { JwtFromRequestFunction } from "passport-jwt";

export const extractAccessToken: JwtFromRequestFunction = (req: Request) => {
    return req.cookies["access"];
};

export const extractRefreshToken: JwtFromRequestFunction = (req: Request) => {
    return req.cookies["refresh"];
};
