import {
    Body,
    Controller,
    Post,
    Res,
    UseGuards,
    Get,
    Param,
    Query,
    Req
} from "@nestjs/common";
import { EventCreateDto, EventQuery } from "./event.dto";
import { EventService } from "./event.service";
import type { Request, Response } from "express";
import { eventResponse, paginatedEvents } from "./event.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";

@Controller("event")
export class EventController {
    constructor(private eventService: EventService) {}

    @Get()
    async getAll(
        @Query() query: EventQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = 20;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = 0;
        }
        const events = await this.eventService.getAll(query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/event`;
        res.json(paginatedEvents(events[0], query, events[1], baseUrl));
    }

    @Get(":id")
    async getById(@Param("id") id: string, @Res() res: Response) {
        const event = await this.eventService.getById(id);
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
        res.json(eventResponse(event));
    }
}
