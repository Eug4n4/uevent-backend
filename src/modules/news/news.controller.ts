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
    UseGuards
} from "@nestjs/common";
import { NewsCreateDto, NewsQuery, NewsUpdateDto } from "./news.dto";
import { NewsService } from "./news.service";
import type { Request, Response } from "express";
import { newsResponse, paginatedNews } from "./news.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";
import { parseIncludes } from "../event/event.dto";

@Controller("news")
export class NewsController {
    private readonly log = new AppLogger(NewsController.name);

    constructor(private newsService: NewsService) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @CurrentUser() user: Express.User,
        @Body() dto: NewsCreateDto,
        @Res() res: Response
    ) {
        const companyId = dto.data.relationships.company.data.id;
        const news = await this.newsService.create(
            { ...dto.data.attributes, company_id: companyId },
            user.id
        );
        this.log.info("POST", "/news", 201, `id=${news.id}`);

        res.status(201).json(newsResponse(news));
    }

    @Get()
    async getAll(
        @Query() query: NewsQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;
        }

        const includes = parseIncludes(req.query["include"] as string | undefined);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/news`;
        const [newsList, total] = await this.newsService.getAll(query, includes);
        this.log.debug("GET", "/news", 200, `total=${total}`);

        res.json(paginatedNews(newsList, query, total, baseUrl, includes));
    }

    @Get(":id")
    async getById(
        @Param("id") id: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const includes = parseIncludes(req.query["include"] as string | undefined);
        const news = await this.newsService.getById(id, includes);
        this.log.debug("GET", `/news/${id}`, 200);

        res.json(newsResponse(news, includes));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Body() dto: NewsUpdateDto,
        @Res() res: Response
    ) {
        if (dto.data.id !== id) {
            this.log.warn("PATCH", `/news/${id}`, 400, "Body id mismatch");
            throw new BadRequestException("Body id does not match URL id");
        }

        const news = await this.newsService.update(id, dto.data.attributes, user.id);
        this.log.info("PATCH", `/news/${id}`, 200);

        res.json(newsResponse(news));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(204)
    async remove(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.newsService.remove(id, user.id);
        this.log.info("DELETE", `/news/${id}`, 204);

        res.status(204).send();
    }
}
