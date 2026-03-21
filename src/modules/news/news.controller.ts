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

@Controller("news")
export class NewsController {
    constructor(private newsService: NewsService) {}

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
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/news`;
        const [newsList, total] = await this.newsService.getAll(query);
        res.json(paginatedNews(newsList, query, total, baseUrl));
    }

    @Get(":id")
    async getById(@Param("id") id: string, @Res() res: Response) {
        const news = await this.newsService.getById(id);
        res.json(newsResponse(news));
    }

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @CurrentUser() user: Express.User,
        @Body() dto: NewsCreateDto,
        @Res() res: Response
    ) {
        const news = await this.newsService.create(
            dto.data.attributes,
            user.id
        );
        res.json(newsResponse(news));
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
            throw new BadRequestException("Body id does not match URL id");
        }
        const news = await this.newsService.update(
            id,
            dto.data.attributes,
            user.id
        );
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
        res.status(204).send();
    }
}
