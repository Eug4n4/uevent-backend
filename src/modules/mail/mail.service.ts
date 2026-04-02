import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Ticket, UserTicket, UserTicketStatus } from "src/db/entity/ticket.entity";
import { database } from "src/db/data-source";
import { Account } from "src/db/entity/account.entity";
import { CompanyMember, CompanySub } from "src/db/entity/company.entity";
import { EventEntity } from "src/db/entity/event.entity";
import { News } from "src/db/entity/news.entity";
import { AppLogger } from "../shared/logger";

@Injectable()
export class MailService {
    private readonly transporter: nodemailer.Transporter;
    private readonly from: string;
    private readonly log = new AppLogger(MailService.name);

    constructor(private config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: config.get<string>("SMTP_HOST"),
            port: config.get<number>("SMTP_PORT") ?? 587,
            secure: false,
            auth: {
                user: config.get<string>("SMTP_USER"),
                pass: config.get<string>("SMTP_PASS")
            }
        });
        this.from = config.get<string>("SMTP_FROM") ?? "noreply@uevent.com";
    }

    async successTicketPurchase(userTicketId: string): Promise<void> {
        const ut = await UserTicket.findOne({
            where: { id: userTicketId },
            relations: { account: true, ticket: { event: true }, transaction: true }
        });
        if (!ut) return;

        const html = this.buildReceiptHtml(ut.transaction.check, ut.ticket, ut.ticket.event);

        try {
            await this.transporter.sendMail({
                from: this.from,
                to: ut.account.email,
                subject: `Ticket purchase confirmed — ${ut.ticket.event.title}`,
                html
            });
        } catch (err) {
            this.log.error("MAIL", "successTicketPurchase", 500, err.message, err.stack);
        }
    }

    async unsuccessTicketPurchase(userId: string, ticketId: string): Promise<void> {
        const [account, ticket] = await Promise.all([
            Account.findOneBy({ id: userId }),
            Ticket.findOne({ where: { id: ticketId }, relations: { event: true } })
        ]);
        if (!account || !ticket) return;

        try {
            await this.transporter.sendMail({
                from: this.from,
                to: account.email,
                subject: `Payment failed — ${ticket.event.title}`,
                html: `
                    <h2>Payment Failed</h2>
                    <p>Unfortunately your payment for <strong>${ticket.name}</strong> (${ticket.event.title}) could not be processed.</p>
                    <p>Please try again or contact support if the issue persists.</p>
                `
            });
        } catch (err) {
            this.log.error("MAIL", "unsuccessTicketPurchase", 500, err.message, err.stack);
        }
    }

    async notificationForNewTicket(userTicketId: string): Promise<void> {
        const ut = await UserTicket.findOne({
            where: { id: userTicketId },
            relations: { account: true, ticket: { event: true }, transaction: true }
        });
        if (!ut) return;
        if (!ut.ticket.event.notificationNewTickets) return;

        const members = await CompanyMember.find({
            where: { companyId: ut.ticket.event.companyId },
            relations: { account: true }
        });

        const receipt = this.buildReceiptHtml(ut.transaction.check, ut.ticket, ut.ticket.event);

        await Promise.all(
            members.map(async (member) => {
                try {
                    await this.transporter.sendMail({
                        from: this.from,
                        to: member.account.email,
                        subject: `New ticket purchase — ${ut.ticket.event.title}`,
                        html: `
                            <h2>New Ticket Purchase</h2>
                            <p>A ticket was purchased by <strong>${ut.account.email}</strong>.</p>
                            ${receipt}
                        `
                    });
                } catch (err) {
                    this.log.error("MAIL", "notificationForNewTicket", 500, err.message, err.stack);
                }
            })
        );
    }

    async eventCanceled(eventId: string): Promise<void> {
        const event = await EventEntity.findOneBy({ id: eventId });
        if (!event) return;

        const userTickets = await database.dataSource.manager
            .createQueryBuilder(UserTicket, "ut")
            .innerJoin(Ticket, "t", "t.id = ut.ticket_id")
            .innerJoinAndSelect("ut.account", "account")
            .where("t.event_id = :eventId", { eventId })
            .andWhere("ut.status != :canceled", { canceled: UserTicketStatus.CANCELED })
            .getMany();

        await Promise.all(
            userTickets.map(async (ut) => {
                try {
                    await this.transporter.sendMail({
                        from: this.from,
                        to: ut.account.email,
                        subject: `Event canceled — ${event.title}`,
                        html: `
                            <h2>Event Canceled</h2>
                            <p>Unfortunately, the event <strong>${event.title}</strong> has been canceled.</p>
                            <p>If you paid for your ticket, a refund will be processed shortly.</p>
                        `
                    });
                } catch (err) {
                    this.log.error("MAIL", "eventCanceled", 500, err.message, err.stack);
                }
            })
        );
    }

    async userTicketCanceled(userTicketId: string): Promise<void> {
        const ut = await UserTicket.findOne({
            where: { id: userTicketId },
            relations: { account: true, ticket: { event: true } }
        });
        if (!ut) return;

        try {
            await this.transporter.sendMail({
                from: this.from,
                to: ut.account.email,
                subject: `Your ticket has been canceled — ${ut.ticket.event.title}`,
                html: `
                    <h2>Ticket Canceled</h2>
                    <p>Your ticket <strong>${ut.ticket.name}</strong> for <strong>${ut.ticket.event.title}</strong> has been canceled.</p>
                    <p>If you paid for this ticket, a refund will be processed shortly.</p>
                `
            });
        } catch (err) {
            this.log.error("MAIL", "userTicketCanceled", 500, err.message, err.stack);
        }
    }

    async companyNewPublished(newsId: string): Promise<void> {
        const news = await News.findOne({
            where: { id: newsId },
            relations: { company: true }
        });
        if (!news) return;

        const subs = await CompanySub.find({
            where: { companyId: news.companyId },
            relations: { account: true }
        });

        await Promise.all(
            subs.map(async (sub) => {
                try {
                    await this.transporter.sendMail({
                        from: this.from,
                        to: sub.account.email,
                        subject: `New post from ${news.company.name} — ${news.name}`,
                        html: `
                            <h2>${news.name}</h2>
                            <p>${news.text}</p>
                            <hr/>
                            <small>You received this email because you are subscribed to <strong>${news.company.name}</strong>.</small>
                        `
                    });
                } catch (err) {
                    this.log.error("MAIL", "companyNewPublished", 500, err.message, err.stack);
                }
            })
        );
    }

    private buildReceiptHtml(
        check: Record<string, unknown>,
        ticket: Ticket,
        event: EventEntity
    ): string {
        const total = (Number(check.final_price) / 100).toFixed(2);
        const unitPrice = Number(check.unit_price).toFixed(2);

        return `
            <h3>Receipt</h3>
            <table>
                <tr><td><strong>Event</strong></td><td>${event.title}</td></tr>
                <tr><td><strong>Ticket</strong></td><td>${ticket.name}</td></tr>
                <tr><td><strong>Quantity</strong></td><td>${check.quantity}</td></tr>
                <tr><td><strong>Unit price</strong></td><td>€${unitPrice}</td></tr>
                ${check.promo_code ? `<tr><td><strong>Promo code</strong></td><td>${check.promo_code} (${check.discount_percent}% off)</td></tr>` : ""}
                <tr><td><strong>Total</strong></td><td>€${total}</td></tr>
                <tr><td><strong>Transaction ID</strong></td><td>${check.payment_intent_id ?? "free ticket"}</td></tr>
            </table>
        `;
    }
}
