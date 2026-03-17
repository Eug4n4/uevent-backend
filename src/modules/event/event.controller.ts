import {
    ForbiddenException,
    Body,
    Controller,
    Post,
    Res,
    UseGuards
} from "@nestjs/common";
import { EventCreateDto } from "./event.dto";
import { EventService } from "./event.service";
import type { Response } from "express";
import { eventResponse } from "./event.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { CompanyService } from "../company/company.service";

@Controller("event")
export class EventController {
    constructor(
        private eventService: EventService,
        private companyService: CompanyService
    ) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(
        @CurrentUser() user: Express.User,
        @Body() dto: EventCreateDto,
        @Res() res: Response
    ) {
        const company = await this.companyService.findById(
            dto.data.attributes.companyId
        );
        if (!this.companyService.isCompanyOwner(company, user.id)) {
            throw new ForbiddenException(
                "Only company owner can create events"
            );
        }
        const event = await this.eventService.create({
            ...dto.data.attributes,
            included: dto.data.included
        });
        res.json(eventResponse(event));
    }
}
