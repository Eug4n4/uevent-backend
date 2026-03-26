import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import { TicketService } from "./ticket.service";
import {
    PromoCodeCreateDto,
    PromoCodeQuery,
    PromoCodeUpdateDto,
    TicketCreateDto,
    TicketQuery,
    TicketUpdateDto
} from "./ticket.dto";
import {
    paginatedPromoCodes,
    paginatedTickets,
    promoCodeResponse,
    ticketResponse
} from "./ticket.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";
import type { Request, Response } from "express";

@Controller()
export class TicketController {
    private readonly log = new AppLogger(TicketController.name);

    constructor(private ticketService: TicketService) {}

    @UseGuards(JwtGuard)
    @Post("tickets")
    async createTicket(
        @Body() dto: TicketCreateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const eventId = dto.data.relationships.event.data.id;
        const ticket = await this.ticketService.createTicket(
            eventId,
            user.id,
            dto.data.attributes
        );
        this.log.info("POST", "/tickets", 201, `id=${ticket.id}`);
        res.status(201).json(ticketResponse(ticket));
    }

    @Get("tickets")
    async getTickets(
        @Query() query: TicketQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [tickets, total] = await this.ticketService.getTickets(query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/tickets`;
        this.log.debug("GET", "/tickets", 200, `total=${total}`);
        res.json(paginatedTickets(tickets, query, total, baseUrl));
    }

    @Get("tickets/:ticketId")
    async getTicket(@Param("ticketId") ticketId: string, @Res() res: Response) {
        const ticket = await this.ticketService.getTicketById(ticketId);
        this.log.debug("GET", `/tickets/${ticketId}`, 200);
        res.json(ticketResponse(ticket));
    }

    @UseGuards(JwtGuard)
    @Patch("tickets/:ticketId")
    async updateTicket(
        @Param("ticketId") ticketId: string,
        @Body() dto: TicketUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ticket = await this.ticketService.updateTicket(
            ticketId,
            user.id,
            dto.data.attributes
        );
        this.log.info("PATCH", `/tickets/${ticketId}`, 200);
        res.json(ticketResponse(ticket));
    }

    @UseGuards(JwtGuard)
    @Delete("tickets/:ticketId")
    async cancelTicket(
        @Param("ticketId") ticketId: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ticket = await this.ticketService.cancelTicket(ticketId, user.id);
        this.log.info("DELETE", `/tickets/${ticketId}`, 200, "status=canceled");
        res.json(ticketResponse(ticket));
    }

    @UseGuards(JwtGuard)
    @Post("promo-codes")
    async createPromoCode(
        @Body() dto: PromoCodeCreateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ticketId = dto.data.relationships.ticket.data.id;
        const promo = await this.ticketService.createPromoCode(
            ticketId,
            user.id,
            dto.data.attributes
        );
        this.log.info("POST", "/promo-codes", 201, `id=${promo.id}`);
        res.status(201).json(promoCodeResponse(promo));
    }

    @UseGuards(JwtGuard)
    @Get("promo-codes")
    async getPromoCodes(
        @Query() query: PromoCodeQuery,
        @CurrentUser() user: Express.User,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [promos, total] = await this.ticketService.getPromoCodes(user.id, query);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/promo-codes`;
        this.log.debug("GET", "/promo-codes", 200, `total=${total}`);
        res.json(paginatedPromoCodes(promos, query, total, baseUrl));
    }

    @Get("promo-codes/:codeId")
    async getPromoCode(
        @Param("codeId") codeId: string,
        @Res() res: Response,
    ) {
        const promo = await this.ticketService.getPromoCodeById(codeId);
        this.log.debug("GET", `/promo-codes/${codeId}`, 200);
        res.json(promoCodeResponse(promo));
    }

    @UseGuards(JwtGuard)
    @Patch("promo-codes/:codeId")
    async updatePromoCode(
        @Param("codeId") codeId: string,
        @Body() dto: PromoCodeUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const promo = await this.ticketService.updatePromoCode(
            codeId,
            user.id,
            dto.data.attributes
        );
        this.log.info(
            "PATCH",
            `/promo-codes/${codeId}`,
            200,
            `status=${promo.status}`
        );
        res.json(promoCodeResponse(promo));
    }

    @UseGuards(JwtGuard)
    @Delete("promo-codes/:codeId")
    async cancelPromoCode(
        @Param("codeId") codeId: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const promo = await this.ticketService.cancelPromoCode(codeId, user.id);
        this.log.info(
            "PATCH",
            `/promo-codes/${codeId}`,
            200,
            `status=${promo.status}`
        );

        res.json(promoCodeResponse(promo));
    }
}
