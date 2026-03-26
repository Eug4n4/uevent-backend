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
import {
    BillingCreateDto,
    CompanyCreateDto,
    CompanyQuery,
    CompanyUpdateDto,
    PageQuery
} from "./company.dto";
import { CompanyService } from "./company.service";
import type { Request, Response } from "express";
import { JwtGuard, OptionalJwtGuard } from "../shared/jwt.guard";
import {
    companyResponse,
    paginatedCompanies,
    paginatedSubscribers,
    paginatedSubscriptions
} from "./company.response";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";

// JSON:API convention requires plural resource names in paths
@Controller("companies")
export class CompanyController {
    private readonly log = new AppLogger(CompanyController.name);

    constructor(private companyService: CompanyService) {}

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
        this.log.info("POST", "/companies", 201, `id=${company.id}`);
        res.status(201).json(companyResponse(company));
    }

    @Get(":id")
    async getById(@Param("id") id: string, @Res() res: Response) {
        const company = await this.companyService.getById(id);
        this.log.debug("GET", `/companies/${id}`, 200);
        res.json(companyResponse(company));
    }

    @UseGuards(OptionalJwtGuard)
    @Get()
    async getAll(
        @Query() query: CompanyQuery,
        @CurrentUser() user: Express.User | null,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [companies, total] = await this.companyService.getAll(
            query,
            user?.id
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/companies`;
        this.log.debug("GET", "/companies", 200, `total=${total}`);
        res.json(paginatedCompanies(companies, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: CompanyUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        // Sanity check: body id must match path param
        if (dto.data.id !== id) {
            this.log.warn("PATCH", `/companies/${id}`, 400, "Body id mismatch");
            throw new BadRequestException("Body id does not match URL id");
        }
        const company = await this.companyService.update(
            id,
            user.id,
            dto.data.attributes
        );
        this.log.info("PATCH", `/companies/${id}`, 200);
        res.json(companyResponse(company));
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
        this.log.info("POST", `/companies/${id}/avatar`, 200);
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
        this.log.info("POST", `/companies/${id}/banner`, 200);
        res.json(companyResponse(company));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(204)
    async delete(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.companyService.delete(id, user.id);
        this.log.info("DELETE", `/companies/${id}`, 204);
        res.status(204).send();
    }

    @UseGuards(JwtGuard)
    @Post(":id/subscriptions")
    async subscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.companyService.subscribe(id, user.id);
        this.log.info("POST", `/companies/${id}/subscriptions`, 201);
        res.status(201).send();
    }

    @UseGuards(JwtGuard)
    @Delete(":id/subscriptions")
    @HttpCode(204)
    async unsubscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.companyService.unsubscribe(id, user.id);
        this.log.info("DELETE", `/companies/${id}/subscriptions`, 204);
        res.status(204).send();
    }

    @Get(":id/subscriptions")
    async getSubscribers(
        @Param("id") id: string,
        @Query() query: PageQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [profiles, total] = await this.companyService.getSubscribers(
            id,
            query
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/companies/${id}/subscriptions`;
        this.log.debug(
            "GET",
            `/companies/${id}/subscriptions`,
            200,
            `total=${total}`
        );
        res.json(paginatedSubscribers(profiles, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Get("subscriptions")
    async getSubscriptions(
        @Query() query: PageQuery,
        @CurrentUser() user: Express.User,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [companies, total] = await this.companyService.getSubscriptions(
            user.id,
            query
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/companies/subscriptions`;
        this.log.debug(
            "GET",
            "/companies/subscriptions",
            200,
            `total=${total}`
        );
        res.json(paginatedSubscriptions(companies, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Post(":id/billing")
    async createBilling(
        @Param("id") id: string,
        @Body() dto: BillingCreateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const billing = await this.companyService.createBilling(
            id,
            user.id,
            dto.data.attributes
        );
        this.log.info("POST", `/companies/${id}/billing`, 201);
        res.status(201).json({
            data: {
                type: "billing",
                attributes: {
                    stripe_account_id: billing.stripeAccountId,
                    created_at: billing.createdAt
                }
            }
        });
    }

    @UseGuards(JwtGuard)
    @Get(":id/billing")
    async getBilling(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const billing = await this.companyService.getBilling(id, user.id);
        this.log.debug("GET", `/companies/${id}/billing`, 200);
        res.json({
            data: {
                type: "billing",
                attributes: {
                    stripe_account_id: billing.stripeAccountId,
                    created_at: billing.createdAt
                }
            }
        });
    }
}
