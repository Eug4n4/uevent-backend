import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CompanyCreateDto, CompanyQuery, CompanyUpdateDto } from "./company.dto";
import { CompanyService } from "./company.service";
import type { Request, Response } from "express";
import { JwtGuard } from "../shared/jwt.guard";
import {
    companyResponse,
    manyCompaniesResponse,
    paginatedCompanies
} from "./company.response";
import { CurrentUser } from "../shared/decorators";

@Controller("company")
export class CompanyController {
    constructor(private companyService: CompanyService) {}

    @Get()
    async getAll(
        @Query() query: CompanyQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) query["page[limit]"] = 20;
        if (query["page[offset]"] === undefined) query["page[offset]"] = 0;
        const [companies, total] = await this.companyService.getAll(query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/company`;
        res.json(paginatedCompanies(companies, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Get("my")
    async getMy(@CurrentUser() user: Express.User, @Res() res: Response) {
        const companies = await this.companyService.findByOwnerId(user.id);
        res.json(manyCompaniesResponse(companies));
    }

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @Body() dto: CompanyCreateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const company = await this.companyService.create(
            dto.data.attributes,
            user.id
        );
        res.status(201).json(companyResponse(company));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: CompanyUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        if (dto.data.id !== id) {
            throw new BadRequestException("Body id does not match URL id");
        }
        const company = await this.companyService.update(
            id,
            user.id,
            dto.data.attributes
        );
        res.json(companyResponse(company));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(204)
    async remove(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.companyService.remove(id, user.id);
        res.status(204).send();
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
