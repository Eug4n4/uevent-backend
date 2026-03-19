import {
    Body,
    Controller,
    Post,
    Res,
    Req,
    HttpStatus,
    HttpCode,
    UseGuards,
    Get,
    Query
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./auth.dto";
import type { TokenPair } from "./auth.types";
import { JwtGuard, JwtRefreshGuard } from "../shared/jwt.guard";
import { authResponse } from "./auth.response";
import { CurrentUser } from "../shared/decorators";

@Controller("account")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("registration")
    async register(@Body() dto: RegisterDto) {
        await this.authService.register({ ...dto.data.attributes });
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
        if (result) {
            this.setTokenPair(res, result);
            res.json(authResponse(result.account));

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

    @Post("login/google")
    loginConsent(@Res() res: Response) {
        res.status(HttpStatus.TEMPORARY_REDIRECT).redirect(
            this.authService.generateGoogleAuthUrl()
        );
    }

    @Get("login/google/callback")
    async loginWithGoogle(@Query("code") code: string, @Res() res: Response) {
        const result = await this.authService.loginWithGoogle(code);
        this.setTokenPair(res, result);
        res.json(authResponse(result.account));
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
    async refresh(@CurrentUser() user: Express.User, @Res() res: Response) {
        try {
            const tokens = await this.authService.refresh(user.id);
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
