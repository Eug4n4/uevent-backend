import {
    Body,
    Controller,
    Post,
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
    EventUpdateDto,
    PageQuery
} from "./event.dto";
import { EventService } from "./event.service";
import type { Request, Response } from "express";
import {
    eventResponse,
    paginatedEvents,
    paginatedEventSubscribers
} from "./event.response";
import { profileResponse } from "../profile/profile.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";

@Controller("events")
export class EventController {
    private readonly log = new AppLogger(EventController.name);

    constructor(private eventService: EventService) {}

    @Get()
    async getAll(
        @Query() query: EventQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;
        }

        const events = await this.eventService.getAll(query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/event`;
        this.log.debug("GET", "/event", 200, `total=${events[1]}`);

        res.json(paginatedEvents(events[0], query, events[1], baseUrl));
    }

    @UseGuards(JwtGuard)
    @Get("my")
    async getMyEvents(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: EventQuery,
        @CurrentUser() user: Express.User
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;
        }

        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/event/my`;
        const events = await this.eventService.getMy(user.id, query);
        this.log.debug("GET", "/event/my", 200, `total=${events[1]}`);

        res.json(paginatedEvents(events[0], query, events[1], baseUrl));
    }

    @Get(":id")
    async getById(@Param("id") id: string, @Res() res: Response) {
        const event = await this.eventService.getById(id);
        this.log.debug("GET", `/event/${id}`, 200);

        res.json(eventResponse(event));
    }

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @CurrentUser() user: Express.User,
        @Body() dto: EventCreateDto,
        @Res() res: Response
    ) {
        const event = await this.eventService.create(
            { ...dto.data.attributes, included: dto.data.included },
            user.id
        );
        this.log.info("POST", "/event", 201, `id=${event.id}`);

        res.status(201).json(eventResponse(event));
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
            this.log.warn("PATCH", `/event/${id}`, 400, "Body id mismatch");
            throw new BadRequestException("Body id does not match URL id");
        }

        const event = await this.eventService.update(
            { ...dto.data.attributes, included: dto.data.included },
            user.id,
            id
        );
        this.log.info("PATCH", `/event/${id}`, 200);

        res.json(eventResponse(event));
    }

    @UseGuards(JwtGuard)
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param("id") id: string, @CurrentUser() user: Express.User) {
        await this.eventService.remove(id, user.id);
        this.log.info("DELETE", `/event/${id}`, 204);
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
        this.log.info("POST", `/event/${id}/avatar`, 200);

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
        this.log.info("POST", `/event/${id}/banner`, 200);

        res.json(eventResponse(event));
    }

    @Get(":id/subscribers")
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

        const [profiles, total] = await this.eventService.getSubscribers(
            id,
            query
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/event/${id}/subscribers`;
        this.log.debug(
            "GET",
            `/event/${id}/subscribers`,
            200,
            `total=${total}`
        );

        res.json(paginatedEventSubscribers(profiles, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Post(":id/subscribe")
    async subscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const profile = await this.eventService.subscribe(id, user.id);
        this.log.info("POST", `/event/${id}/subscribe`, 201);

        res.status(201).json(profileResponse(profile));
    }

    @UseGuards(JwtGuard)
    @Delete(":id/subscribe")
    @HttpCode(HttpStatus.NO_CONTENT)
    async unsubscribe(
        @Param("id") id: string,
        @CurrentUser() user: Express.User
    ) {
        await this.eventService.unsubscribe(id, user.id);
        this.log.info("DELETE", `/event/${id}/subscribe`, 204);
    }
}
