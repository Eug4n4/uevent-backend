import {
    Body,
    Controller,
    Post,
    Res,
    Req,
    HttpStatus,
    HttpCode,
    UseGuards
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./auth.dto";
import type { TokenPair } from "./auth.types";
import { JwtGuard, JwtRefreshGuard } from "../shared/jwt.guard";

@Controller("account")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("registration")
    async register(@Body() dto: RegisterDto) {
        await this.authService.register(dto);
    }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.cookies.access && req.cookies.refresh) {
            return res.status(HttpStatus.CONFLICT).json({
                errors: [
                    {
                        title: "Conflict",
                        detail: "Already authenticated",
                        status: HttpStatus.CONFLICT
                    }
                ]
            });
        }

        const result = await this.authService.login(dto);
        if (result && result.account) {
            this.setTokenPair(res, result);
            res.json({
                data: {
                    id: result.account.id, //This is the most important part, because it is used to identify the user in the frontend
                    type: "account",
                    attributes: {
                        role: result.account.role,
                        email: result.account.email,
                        updatedAt: result.account.updatedAt,
                        createdAt: result.account.createdAt
                    },
                    relationships: {
                        profile: {
                            data: {
                                id: result.account.id,
                                type: "profile"
                            }
                        }
                    }
                }
            });

            return;
        }

        res.status(HttpStatus.BAD_REQUEST).json({
            errors: [
                {
                    title: "Bad request",
                    detail: "Invalid email or password",
                    status: HttpStatus.BAD_REQUEST
                }
            ]
        });
    }

    @UseGuards(JwtGuard)
    @Post("logout")
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie("access");
        res.clearCookie("refresh");
    }

    @UseGuards(JwtRefreshGuard)
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res() res: Response) {
        try {
            const tokens = await this.authService.refresh(req.cookies.refresh);
            this.setTokenPair(res, tokens);
            res.send();
        } catch {
            res.status(HttpStatus.UNAUTHORIZED).json({
                errors: [
                    {
                        title: "Forbidden",
                        detail: "Invalid refresh token",
                        status: HttpStatus.UNAUTHORIZED
                    }
                ]
            });
        }
    }

    private setTokenPair(res: Response, tokens: TokenPair) {
        res.cookie("access", tokens.access.token, {
            expires: new Date(tokens.access.expires)
        });
        res.cookie("refresh", tokens.refresh.token, {
            httpOnly: true,
            expires: new Date(tokens.refresh.expires)
        });
    }
}
