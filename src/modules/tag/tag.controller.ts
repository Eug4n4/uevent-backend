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
import type { Request, Response } from "express";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { TagCreateDto, TagQuery, TagUpdateDto } from "./tag.dto";
import { TagService } from "./tag.service";
import { paginatedTags, tagResponse } from "./tag.response";
import { AppLogger } from "../shared/logger";

@Controller("events/tags")
export class TagController {
    private readonly log = new AppLogger(TagController.name);

    constructor(private tagService: TagService) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @Body() dto: TagCreateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const tag = await this.tagService.create(dto.data.attributes, user.id);
        this.log.info("POST", "/events/tags", 201, `id=${tag.id}`);

        res.status(201).json(tagResponse(tag));
    }

    @Get()
    async getAll(
        @Query() query: TagQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) query["page[limit]"] = 20;
        if (query["page[offset]"] === undefined) query["page[offset]"] = 0;

        const include = req.query["include"] as string | undefined;
        const [tags, total, eventsMap] = await this.tagService.getAll(query, include);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/tag`;
        this.log.debug("GET", "/tag", 200, `total=${total}`);

        res.json(paginatedTags(tags, query, total, baseUrl, eventsMap));
    }

    @Get(":id")
    async getById(
        @Param("id") id: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const include = req.query["include"] as string | undefined;
        const [tag, events] = await this.tagService.getById(id, include);
        this.log.debug("GET", `/tag/${id}`, 200);

        res.json(tagResponse(tag, include === "events" ? events : undefined));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: TagUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        if (dto.data.id !== id) {
            this.log.warn(
                "PATCH",
                `/events/tags/${id}`,
                400,
                "Body id mismatch"
            );
            throw new BadRequestException("Body id does not match URL id");
        }

        const tag = await this.tagService.update(
            id,
            dto.data.attributes,
            user.id
        );
        this.log.info("PATCH", `/events/tags/${id}`, 200);

        res.json(tagResponse(tag));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(204)
    async delete(@Param("id") id: string, @Res() res: Response) {
        await this.tagService.delete(id);
        this.log.info("DELETE", `/events/tags/${id}`, 204);

        res.status(204).send();
    }
}
