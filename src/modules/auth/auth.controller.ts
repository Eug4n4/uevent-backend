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
import { RegisterDto } from "./dto/register.dto";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { TokenPair } from "./types/token.types";

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
        if (result && result.profile) {
            this.setTokenPair(res, result);
            res.json({
                data: {
                    type: "profile",
                    attributes: {
                        username: result.profile.username,
                        avatar: result.profile.avatar,
                        createdAt: result.profile.createdAt
                    }
                }
            });
        } else {
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
    }
    @UseGuards(JwtAuthGuard)
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
