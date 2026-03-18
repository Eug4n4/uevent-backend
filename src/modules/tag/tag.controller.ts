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
import { TagCreateDto, TagQuery, TagUpdateDto } from "./tag.dto";
import { TagService } from "./tag.service";
import { paginatedTags, tagResponse } from "./tag.response";

@Controller("tag")
export class TagController {
    constructor(private tagService: TagService) {}

    @Get()
    async getAll(
        @Query() query: TagQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) query["page[limit]"] = 20;
        if (query["page[offset]"] === undefined) query["page[offset]"] = 0;

        const [tags, total] = await this.tagService.getAll(query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/tag`;
        res.json(paginatedTags(tags, query, total, baseUrl));
    }

    @Get(":id")
    async getById(@Param("id") id: string, @Res() res: Response) {
        const tag = await this.tagService.getById(id);
        res.json(tagResponse(tag));
    }

    @UseGuards(JwtGuard)
    @Post()
    async create(@Body() dto: TagCreateDto, @Res() res: Response) {
        const tag = await this.tagService.create(dto.data.attributes);
        res.status(201).json(tagResponse(tag));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: TagUpdateDto,
        @Res() res: Response
    ) {
        if (dto.data.id !== id) {
            throw new BadRequestException("Body id does not match URL id");
        }
        const tag = await this.tagService.update(id, dto.data.attributes);
        res.json(tagResponse(tag));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(204)
    async remove(@Param("id") id: string, @Res() res: Response) {
        await this.tagService.remove(id);
        res.status(204).send();
    }
}
