import {
    Body,
    Controller,
    Post,
    Put,
    Res,
    UseGuards,
    Get,
    Param,
    Query,
    Req,
    Patch,
    BadRequestException,
    Delete,
    HttpCode,
    HttpStatus,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
    EventCreateDto,
    EventQuery,
    EventTagsDto,
    EventUpdateDto,
    PageQuery,
    parseIncludes
} from "./event.dto";
import { EventService } from "./event.service";
import type { Request, Response } from "express";
import {
    eventResponse,
    paginatedEvents,
    paginatedEventSubscribers
} from "./event.response";
import { profileResponse } from "../profile/profile.response";
import { JwtGuard, OptionalJwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";

@Controller("events")
export class EventController {
    private readonly log = new AppLogger(EventController.name);

    constructor(private eventService: EventService) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @CurrentUser() user: Express.User,
        @Body() dto: EventCreateDto,
        @Res() res: Response
    ) {
        const tagIds = dto.data.relationships.tags?.data?.map((t) => t.id);
        const companyId = dto.data.relationships.company.data.id;
        const event = await this.eventService.create(
            { ...dto.data.attributes, company_id: companyId, tagIds },
            user.id
        );
        this.log.info("POST", "/events", 201, `id=${event.id}`);

        res.status(201).json(eventResponse(event));
    }

    @UseGuards(OptionalJwtGuard)
    @Get()
    async getAll(
        @Query() query: EventQuery,
        @CurrentUser() user: Express.User | null,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;
        }

        const includes = parseIncludes(
            req.query["include"] as string | undefined
        );
        const events = await this.eventService.getAll(
            query,
            user?.id,
            includes
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/events`;
        this.log.debug("GET", "/events", 200, `total=${events[1]}`);

        res.json(
            paginatedEvents(events[0], query, events[1], baseUrl, includes)
        );
    }

    @UseGuards(OptionalJwtGuard)
    @Get(":id")
    async getById(
        @Param("id") id: string,
        @CurrentUser() user: Express.User | null,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const includes = parseIncludes(
            req.query["include"] as string | undefined
        );

        const event = await this.eventService.getById(id, user?.id, includes);
        this.log.debug("GET", `/events/${id}`, 200);

        res.json(eventResponse(event, includes));
    }

    @UseGuards(JwtGuard)
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: EventUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        if (dto.data.id !== id) {
            this.log.warn("PATCH", `/events/${id}`, 400, "Body id mismatch");
            throw new BadRequestException("Body id does not match URL id");
        }

        const event = await this.eventService.update(
            dto.data.attributes,
            user.id,
            id
        );
        this.log.info("PATCH", `/events/${id}`, 200);

        res.json(eventResponse(event));
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
        const event = await this.eventService.uploadAvatar(id, user.id, avatar);
        this.log.info("POST", `/events/${id}/avatar`, 200);

        res.json(eventResponse(event));
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
        const event = await this.eventService.uploadBanner(id, user.id, banner);
        this.log.info("POST", `/events/${id}/banner`, 200);

        res.json(eventResponse(event));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param("id") id: string, @CurrentUser() user: Express.User) {
        await this.eventService.remove(id, user.id);
        this.log.info("DELETE", `/events/${id}`, 204);
    }

    @UseGuards(JwtGuard)
    @Put(":id/tags")
    async setTags(
        @Param("id") id: string,
        @Body() dto: EventTagsDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const event = await this.eventService.setTags(
            id,
            dto.data.map((t) => t.id),
            user.id
        );
        this.log.info("PUT", `/events/${id}/tags`, 200);
        res.json(eventResponse(event));
    }

    @UseGuards(JwtGuard)
    @Post(":id/tags/:tagId")
    async addTag(
        @Param("id") id: string,
        @Param("tagId") tagId: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const event = await this.eventService.addTag(id, tagId, user.id);
        this.log.info("POST", `/events/${id}/tags/${tagId}`, 200);
        res.json(eventResponse(event));
    }

    @UseGuards(JwtGuard)
    @Delete(":id/tags/:tagId")
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeTag(
        @Param("id") id: string,
        @Param("tagId") tagId: string,
        @CurrentUser() user: Express.User
    ) {
        await this.eventService.removeTag(id, tagId, user.id);
        this.log.info("DELETE", `/events/${id}/tags/${tagId}`, 204);
    }

    @UseGuards(JwtGuard)
    @Post(":id/subscriptions")
    async subscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const profile = await this.eventService.subscribe(id, user.id);
        this.log.info("POST", `/events/${id}/subscriptions`, 201);

        res.status(201).json(profileResponse(profile));
    }

    @UseGuards(JwtGuard)
    @Delete(":id/subscriptions")
    @HttpCode(HttpStatus.NO_CONTENT)
    async unsubscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User
    ) {
        await this.eventService.unsubscribe(id, user.id);
        this.log.info("DELETE", `/events/${id}/subscriptions`, 204);
    }

    @UseGuards(OptionalJwtGuard)
    @Get(":id/subscriptions")
    async getSubscribers(
        @Param("id") id: string,
        @Query() query: PageQuery,
        @CurrentUser() user: Express.User | null,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [profiles, total] = await this.eventService.getSubscribers(
            id,
            query,
            user?.id
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/events/${id}/subscriptions`;
        this.log.debug(
            "GET",
            `/event/${id}/subscriptions`,
            200,
            `total=${total}`
        );

        res.json(paginatedEventSubscribers(profiles, query, total, baseUrl));
    }
}
