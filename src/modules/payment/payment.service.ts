import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { database } from "src/db/data-source";
import { Ticket, TicketStatus, UserTicket, UserTicketStatus } from "src/db/entity/ticket.entity";
import { PromoCode, PromoCodeStatus } from "src/db/entity/promo_code.entity";
import { Transaction, TransactionStatus } from "src/db/entity/transaction.entity";
import { CompanyBilling, CompanyMember } from "src/db/entity/company.entity";
import { EventEntity } from "src/db/entity/event.entity";
import { PurchaseAttributes, TransactionQuery, UserTicketPageQuery } from "./payment.dto";
import { AppLogger } from "../shared/logger";
import { MailService } from "../mail/mail.service";

@Injectable()
export class PaymentService {
    private readonly stripe: Stripe;
    private readonly platformFee: number;
    private readonly log = new AppLogger(PaymentService.name);

    constructor(
        private config: ConfigService,
        private mail: MailService
    ) {
        this.stripe = new Stripe(config.get<string>("STRIPE_SECRET_KEY") ?? "");
        this.platformFee = parseFloat(
            config.get<string>("PLATFORM_FEE") ?? "0.05"
        );
    }

    async purchaseTicket(
        ticketId: string,
        accountId: string,
        dto: PurchaseAttributes
    ) {
        const quantity = dto.quantity ?? 1;

        const ticket = await Ticket.findOneBy({ id: ticketId });
        if (!ticket) throw new NotFoundException("Ticket not found");
        if (ticket.status === TicketStatus.CANCELED)
            throw new ConflictException("Ticket is not available");

        const event = await EventEntity.findOneBy({ id: ticket.eventId });
        if (!event) throw new NotFoundException("Event not found");

        const billing = await CompanyBilling.findOneBy({ companyId: event.companyId });
        if (!billing)
            throw new BadRequestException("Company billing is not set up");

        let promo: PromoCode | null = null;
        if (dto.promo_code) {
            promo = await PromoCode.findOneBy({ code: dto.promo_code, ticketId });
            if (!promo)
                throw new NotFoundException("Promo code not found");
            if (promo.status === PromoCodeStatus.CANCELED)
                throw new ConflictException("Promo code is no longer active");
            if (promo.used + quantity > promo.total)
                throw new ConflictException("Promo code does not have enough uses remaining");
        }

        const discountMultiplier = promo ? 1 - promo.discountPercent / 100 : 1;
        const unitPrice = Math.round(ticket.price * discountMultiplier * 100);
        const finalPrice = unitPrice * quantity;

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const lockedTicket = await queryRunner.manager.findOne(Ticket, {
                where: { id: ticketId },
                lock: { mode: "pessimistic_write" }
            });
            if (!lockedTicket || lockedTicket.sold + quantity > lockedTicket.total)
                throw new ConflictException("Not enough tickets available");

            let paymentIntentId: string | null = null;
            let clientSecret: string | null = null;

            if (finalPrice > 0) {
                const intent = await this.stripe.paymentIntents.create({
                    amount: finalPrice,
                    currency: "eur",
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: "never"
                    },
                    application_fee_amount: Math.round(finalPrice * this.platformFee),
                    transfer_data: { destination: billing.stripeAccountId },
                    metadata: {
                        ticketId,
                        accountId,
                        promoCodeId: promo?.id ?? "",
                        quantity: String(quantity),
                    }
                });
                paymentIntentId = intent.id;
                clientSecret = intent.client_secret;
            }

            const check = {
                ticket_id: ticket.id,
                ticket_name: ticket.name,
                quantity,
                account_id: accountId,
                promo_code_id: promo?.id ?? null,
                promo_code: promo?.code ?? null,
                discount_percent: promo?.discountPercent ?? null,
                unit_price: ticket.price,
                final_price: finalPrice,
                currency: "eur",
                payment_intent_id: paymentIntentId
            };

            const transaction = queryRunner.manager.create(Transaction, {
                paymentIntentId,
                status: finalPrice === 0 ? TransactionStatus.PAID : TransactionStatus.PENDING,
                description: `Purchase of ${quantity}x ${ticket.name}`,
                finalPrice,
                check
            });
            await queryRunner.manager.save(transaction);

            let firstFreeUserTicketId: string | null = null;

            if (finalPrice === 0) {
                const userTickets = Array.from({ length: quantity }, () =>
                    queryRunner.manager.create(UserTicket, {
                        accountId,
                        ticketId: ticket.id,
                        promoCodeId: promo?.id ?? null,
                        transactionId: transaction.id,
                        status: UserTicketStatus.UNUSED,
                    })
                );
                await queryRunner.manager.save(userTickets);
                firstFreeUserTicketId = (userTickets[0] as UserTicket).id;

                await queryRunner.manager.increment(Ticket, { id: ticketId }, "sold", quantity);

                if (promo) {
                    await queryRunner.manager.increment(PromoCode, { id: promo.id }, "used", quantity);
                }
            }

            await queryRunner.commitTransaction();

            if (firstFreeUserTicketId) {
                void this.mail.successTicketPurchase(firstFreeUserTicketId);
                void this.mail.notificationForNewTicket(firstFreeUserTicketId);
            }

            return {
                clientSecret,
                transactionId: transaction.id,
                finalPrice,
                currency: "eur"
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async handleWebhook(rawBody: Buffer, signature: string) {
        const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET") ?? "";
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            this.log.warn("POST", "/stripe/webhook", 400, `Signature error: ${err.message}`);
            throw new BadRequestException("Invalid webhook signature");
        }

        if (event.type === "payment_intent.succeeded") {
            const intent = event.data.object as Stripe.PaymentIntent;
            await this.handlePaymentSuccess(intent);
        } else if (event.type === "payment_intent.payment_failed") {
            const intent = event.data.object as Stripe.PaymentIntent;
            await this.handlePaymentFailure(intent);
        }
    }

    private async handlePaymentSuccess(intent: Stripe.PaymentIntent) {
        const transaction = await Transaction.findOneBy({ paymentIntentId: intent.id });
        if (!transaction || transaction.status !== TransactionStatus.PENDING) return;

        const { ticketId, accountId, promoCodeId, quantity: quantityStr } = intent.metadata;
        const quantity = parseInt(quantityStr || "1", 10);

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(
                Transaction,
                { id: transaction.id },
                { status: TransactionStatus.PAID }
            );

            const userTickets = Array.from({ length: quantity }, () =>
                queryRunner.manager.create(UserTicket, {
                    accountId,
                    ticketId,
                    promoCodeId: promoCodeId || null,
                    transactionId: transaction.id,
                    status: UserTicketStatus.UNUSED
                })
            );
            await queryRunner.manager.save(userTickets);

            await queryRunner.manager.increment(Ticket, { id: ticketId }, "sold", quantity);

            if (promoCodeId) {
                await queryRunner.manager.increment(PromoCode, { id: promoCodeId }, "used", quantity);
            }

            await queryRunner.commitTransaction();
            this.log.info("POST", "/stripe/webhook", 200, `payment_intent.succeeded intent=${intent.id} quantity=${quantity}`);

            void this.mail.successTicketPurchase((userTickets[0] as UserTicket).id);
            void this.mail.notificationForNewTicket((userTickets[0] as UserTicket).id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.log.error("POST", "/stripe/webhook", 500, err.message, err.stack);
        } finally {
            await queryRunner.release();
        }
    }

    private async handlePaymentFailure(intent: Stripe.PaymentIntent): Promise<void> {
        const { accountId, ticketId } = intent.metadata;
        if (!accountId || !ticketId) return;
        void this.mail.unsuccessTicketPurchase(accountId, ticketId);
        this.log.info("POST", "/stripe/webhook", 200, `payment_intent.payment_failed intent=${intent.id}`);
    }

    async getUserTickets(
        accountId: string,
        query: UserTicketPageQuery
    ): Promise<[UserTicket[], number]> {
        return database.dataSource.manager.findAndCount(UserTicket, {
            where: { accountId },
            relations: { ticket: true },
            order: { createdAt: "DESC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async getUserTicketById(id: string, accountId: string): Promise<UserTicket> {
        const ut = await UserTicket.findOne({
            where: { id, accountId },
            relations: { ticket: true }
        });
        if (!ut) throw new NotFoundException("User ticket not found");
        return ut;
    }

    async redeemUserTicket(
        id: string,
        accountId: string,
        status: "used" | "unused"
    ): Promise<UserTicket> {
        const ut = await UserTicket.findOne({
            where: { id },
            relations: { ticket: true }
        });
        if (!ut) throw new NotFoundException("User ticket not found");
        if (ut.status === UserTicketStatus.CANCELED)
            throw new ConflictException("User ticket is already canceled");

        const event = await EventEntity.findOneBy({ id: ut.ticket.eventId });
        if (!event) throw new NotFoundException("Event not found");

        const member = await CompanyMember.findOne({
            where: { companyId: event.companyId, accountId }
        });
        if (!member)
            throw new ForbiddenException("Only company members can update ticket status");

        ut.status = status as UserTicketStatus;
        await ut.save();
        await ut.reload();
        return ut;
    }

    async getTransactions(
        accountId: string,
        query: TransactionQuery
    ): Promise<[Transaction[], number]> {
        const qb = database.dataSource.manager
            .createQueryBuilder(Transaction, "t")
            .innerJoin("user_tickets", "ut", "ut.transaction_id = t.id");

        const hasPrivilegedFilter = !!(query.company_id || query.event_id || query.ticket_id || query.promo_code_id);

        if (!hasPrivilegedFilter && !query.account_id) {
            throw new BadRequestException(
                "At least one filter is required: account_id, company_id, event_id, ticket_id, or promo_code_id"
            );
        }

        if (!hasPrivilegedFilter && query.account_id !== accountId) {
            throw new ForbiddenException("You can only view your own transactions");
        }

        if (query.company_id) {
            await this.requireCompanyMember(query.company_id, accountId);
            qb.innerJoin("tickets", "tk", "tk.id = ut.ticket_id")
                .innerJoin("events", "e", "e.id = tk.event_id")
                .andWhere("e.company_id = :companyId", { companyId: query.company_id });
        } else if (query.event_id) {
            const event = await EventEntity.findOneBy({ id: query.event_id });
            if (!event) throw new NotFoundException("Event not found");
            await this.requireCompanyMember(event.companyId, accountId);
            qb.innerJoin("tickets", "tk", "tk.id = ut.ticket_id")
                .andWhere("tk.event_id = :eventId", { eventId: query.event_id });
        } else if (query.ticket_id) {
            const ticket = await Ticket.findOneBy({ id: query.ticket_id });
            if (!ticket) throw new NotFoundException("Ticket not found");
            const event = await EventEntity.findOneBy({ id: ticket.eventId });
            if (!event) throw new NotFoundException("Event not found");
            await this.requireCompanyMember(event.companyId, accountId);
            qb.andWhere("ut.ticket_id = :ticketId", { ticketId: query.ticket_id });
        } else if (query.promo_code_id) {
            const promo = await PromoCode.findOneBy({ id: query.promo_code_id });
            if (!promo) throw new NotFoundException("Promo code not found");
            const ticket = await Ticket.findOneBy({ id: promo.ticketId });
            if (!ticket) throw new NotFoundException("Ticket not found");
            const event = await EventEntity.findOneBy({ id: ticket.eventId });
            if (!event) throw new NotFoundException("Event not found");
            await this.requireCompanyMember(event.companyId, accountId);
            qb.andWhere("ut.promo_code_id = :promoCodeId", { promoCodeId: query.promo_code_id });
        }

        if (query.account_id) {
            qb.andWhere("ut.account_id = :filterAccountId", { filterAccountId: query.account_id });
        }

        qb.orderBy("t.createdAt", "DESC")
            .skip(query["page[offset]"])
            .take(query["page[limit]"]);

        return qb.getManyAndCount();
    }

    async getTransactionById(id: string, accountId: string): Promise<Transaction> {
        const transaction = await Transaction.findOneBy({ id });
        if (!transaction) throw new NotFoundException("Transaction not found");

        const ut = await database.dataSource.manager
            .createQueryBuilder(UserTicket, "ut")
            .innerJoin("tickets", "tk", "tk.id = ut.ticket_id")
            .innerJoin("events", "e", "e.id = tk.event_id")
            .where("ut.transaction_id = :id", { id })
            .select(["ut.accountId", "e.companyId"])
            .getRawOne();

        if (!ut) throw new NotFoundException("Transaction not found");

        const isOwner = ut.ut_account_id === accountId;
        const isMember = !!(await CompanyMember.findOneBy({
            companyId: ut.e_company_id,
            accountId
        }));

        if (!isOwner && !isMember)
            throw new ForbiddenException("Access denied");

        return transaction;
    }

    private async requireCompanyMember(companyId: string, accountId: string): Promise<void> {
        const member = await CompanyMember.findOneBy({ companyId, accountId });
        if (!member)
            throw new ForbiddenException("Only company members can view these transactions");
    }

    async cancelUserTicket(id: string, accountId: string): Promise<UserTicket> {
        const ut = await UserTicket.findOne({
            where: { id },
            relations: { ticket: true }
        });
        if (!ut) throw new NotFoundException("User ticket not found");
        if (ut.status === UserTicketStatus.CANCELED)
            throw new ConflictException("User ticket is already canceled");

        const event = await EventEntity.findOneBy({ id: ut.ticket.eventId });
        if (!event) throw new NotFoundException("Event not found");

        const member = await CompanyMember.findOne({
            where: { companyId: event.companyId, accountId }
        });
        if (!member)
            throw new ForbiddenException("Only company members can cancel user tickets");

        ut.status = UserTicketStatus.CANCELED;
        await ut.save();
        await ut.reload();
        void this.mail.userTicketCanceled(id);
        return ut;
    }
}
