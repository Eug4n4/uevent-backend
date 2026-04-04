import {
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
import { PaymentService } from "./payment.service";
import {
    PurchaseDto,
    TransactionQuery,
    UserTicketPageQuery,
    UserTicketUpdateDto
} from "./payment.dto";
import {
    paginatedTransactions,
    paginatedUserTickets,
    transactionResponse,
    userTicketResponse
} from "./payment.response";
import { JwtGuard } from "../shared/jwt.guard";
import { CurrentUser } from "../shared/decorators";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { AppLogger } from "../shared/logger";
import type { Request, Response } from "express";

@Controller()
export class PaymentController {
    private readonly log = new AppLogger(PaymentController.name);

    constructor(private paymentService: PaymentService) {}

    @UseGuards(JwtGuard)
    @Post("tickets/:ticketId/purchase")
    async purchase(
        @Param("ticketId") ticketId: string,
        @Body() dto: PurchaseDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const result = await this.paymentService.purchaseTicket(
            ticketId,
            user.id,
            dto.data.attributes
        );
        this.log.info(
            "POST",
            `/tickets/${ticketId}/purchase`,
            201,
            `transactionId=${result.transactionId}`
        );
        if (result.finalPrice === 0) {
            res.status(201).send();
            return;
        }
        res.status(201).json({
            data: {
                type: "purchase",
                attributes: {
                    client_secret: result.clientSecret,
                    transaction_id: result.transactionId,
                    final_price: result.finalPrice, // in cents
                    currency: result.currency
                }
            }
        });
    }

    @Post("webhooks/stripe")
    async webhook(
        @Req() req: Request & { rawBody?: Buffer },
        @Res() res: Response
    ) {
        const signature = (req.headers as Record<string, string>)[
            "stripe-signature"
        ];
        await this.paymentService.handleWebhook(req.rawBody!, signature);
        // Stripe expects a 2xx response quickly; detailed processing is async
        res.json({ received: true });
    }

    @UseGuards(JwtGuard)
    @Get("user-tickets")
    async getUserTickets(
        @Query() query: UserTicketPageQuery,
        @CurrentUser() user: Express.User,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [uts, total] = await this.paymentService.getUserTickets(
            user.id,
            query
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/user-tickets`;
        this.log.debug("GET", "/user-tickets", 200, `total=${total}`);
        res.json(paginatedUserTickets(uts, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Get("user-tickets/:id")
    async getUserTicketById(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ut = await this.paymentService.getUserTicketById(id, user.id);
        this.log.debug("GET", `/user-tickets/${id}`, 200);
        res.json(userTicketResponse(ut));
    }

    @UseGuards(JwtGuard)
    @Patch("user-tickets/:id")
    async redeemUserTicket(
        @Param("id") id: string,
        @Body() dto: UserTicketUpdateDto,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ut = await this.paymentService.redeemUserTicket(
            id,
            user.id,
            dto.data.attributes.status
        );
        this.log.info(
            "PATCH",
            `/user-tickets/${id}`,
            200,
            `status=${dto.data.attributes.status}`
        );
        res.json(userTicketResponse(ut));
    }

    @UseGuards(JwtGuard)
    @Delete("user-tickets/:id")
    @HttpCode(200)
    async cancelUserTicket(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const ut = await this.paymentService.cancelUserTicket(id, user.id);
        this.log.info("DELETE", `/user-tickets/${id}`, 200, "status=canceled");
        res.json(userTicketResponse(ut));
    }

    @UseGuards(JwtGuard)
    @Get("transactions")
    async getTransactions(
        @Query() query: TransactionQuery,
        @CurrentUser() user: Express.User,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined)
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        if (query["page[offset]"] === undefined)
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;

        const [transactions, total] = await this.paymentService.getTransactions(
            user.id,
            query
        );
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/transactions`;
        this.log.debug("GET", "/transactions", 200, `total=${total}`);
        res.json(paginatedTransactions(transactions, query, total, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Get("transactions/:id")
    async getTransactionById(
        @Param("id") id: string,
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const transaction = await this.paymentService.getTransactionById(
            id,
            user.id
        );
        this.log.debug("GET", `/transactions/${id}`, 200);
        res.json(transactionResponse(transaction));
    }
}
