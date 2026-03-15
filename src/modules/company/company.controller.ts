import {
    Body,
    Controller,
    Param,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CompanyCreateDto } from "./company.dto";
import { CompanyService } from "./company.service";
import type { Request, Response } from "express";
import { JwtGuard } from "../shared/jwt.guard";
import { companyResponse } from "./company.response";
import { CurrentUser } from "../shared/decorators";

@Controller("company")
export class CompanyController {
    constructor(private companyService: CompanyService) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @Body() dto: CompanyCreateDto,
        @CurrentUser() user: Express.User
    ) {
        await this.companyService.create(dto.data.attributes, user.id);
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor("avatar"))
    @Post(":id/avatar")
    async uploadAvatar(
        @Param("id") id: string,
        @UploadedFile() avatar: Express.Multer.File,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const company = await this.companyService.uploadAvatar(
            id,
            user.id,
            avatar
        );
        res.json(companyResponse(company));
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor("banner"))
    @Post(":id/banner")
    async uploadBanner(
        @Param("id") id: string,
        @UploadedFile() banner: Express.Multer.File,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const company = await this.companyService.uploadBanner(
            id,
            user.id,
            banner
        );
        res.json(companyResponse(company));
    }
}
