import {
    Body,
    Controller,
    Post,
    Res,
    Req,
    HttpStatus,
    HttpCode
} from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("account")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("registration")
    async register(@Body() dto: RegisterDto) {
        await this.authService.register(dto);
    }
    @HttpCode(HttpStatus.OK)
    @Post("login")
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
            res.cookie("access", result.access.token, {
                expires: new Date(result.access.expires)
            });
            res.cookie("refresh", result.refresh.token, {
                httpOnly: true,
                expires: new Date(result.refresh.expires)
            });
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
}
