import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import {
    PromoCodeCreateAttributes,
    PromoCodeQuery,
    PromoCodeUpdateAttributes,
    TicketQuery,
    TicketUpdateAttributes
} from "./ticket.dto";

type TicketCreateAttributes = {
    name: string;
    description?: string;
    price: number;
    total: number;
};
import { Ticket, TicketStatus, UserTicket, UserTicketStatus } from "src/db/entity/ticket.entity";
import { PromoCode, PromoCodeStatus } from "src/db/entity/promo_code.entity";
import { EventEntity } from "src/db/entity/event.entity";
import { CompanyBilling, CompanyMember, CompanyMemberRole } from "src/db/entity/company.entity";
import { database } from "src/db/data-source";

const ticketSortColumn: Record<string, string> = {
    price: "ticket.price",
    created_at: "ticket.createdAt"
};

@Injectable()
export class TicketService {

    async createTicket(eventId: string, accountId: string, dto: TicketCreateAttributes) {
        const event = await this.getEvent(eventId);
        await this.requireEventOwner(event, accountId);
        await this.requireCompanyBilling(event.companyId);

        const ticket = Ticket.create({
            eventId,
            name: dto.name,
            description: dto.description ?? null,
            price: dto.price,
            total: dto.total
        });
        await ticket.save();
        return ticket;
    }

    async getTickets(query: TicketQuery): Promise<[Ticket[], number]> {
        const qb = database.dataSource.manager
            .createQueryBuilder(Ticket, "ticket");

        if (query.event_id) {
            await this.getEvent(query.event_id);
            qb.andWhere("ticket.eventId = :eventId", { eventId: query.event_id });
        }

        if (query.company_id) {
            qb.innerJoin("ticket.event", "event")
                .andWhere("event.companyId = :companyId", { companyId: query.company_id });
        }

        if (query.available) {
            qb.andWhere("ticket.sold < ticket.total");
        }

        if (query.status?.length) {
            qb.andWhere("ticket.status IN (:...statuses)", { statuses: query.status });
        }

        if (query.min_cost !== undefined) {
            qb.andWhere("ticket.price >= :minCost", { minCost: query.min_cost });
        }
        if (query.max_cost !== undefined) {
            qb.andWhere("ticket.price <= :maxCost", { maxCost: query.max_cost });
        }

        const sortRaw = query.sort ?? "created_at";
        const desc = sortRaw.startsWith("-");
        const field = sortRaw.replace(/^-/, "");
        qb.orderBy(ticketSortColumn[field], desc ? "DESC" : "ASC");

        qb.skip(query["page[offset]"]).take(query["page[limit]"]);

        return qb.getManyAndCount();
    }

    async getTicketById(ticketId: string): Promise<Ticket> {
        const ticket = await Ticket.findOneBy({ id: ticketId });
        if (!ticket) throw new NotFoundException("Ticket not found");
        return ticket;
    }

    async updateTicket(
        ticketId: string,
        accountId: string,
        dto: TicketUpdateAttributes
    ) {
        const ticket = await this.getTicketById(ticketId);
        const event = await this.getEvent(ticket.eventId);
        await this.requireEventOwner(event, accountId);

        if (dto.total !== undefined && dto.total < ticket.sold) {
            throw new ConflictException(
                `Total cannot be less than already sold (${ticket.sold})`
            );
        }

        Object.assign(
            ticket,
            Object.fromEntries(
                Object.entries(dto).filter(([, v]) => v !== undefined)
            )
        );

        await ticket.save();
        await ticket.reload();
        return ticket;
    }

    async cancelTicket(ticketId: string, accountId: string): Promise<Ticket> {
        const ticket = await this.getTicketById(ticketId);
        const event = await this.getEvent(ticket.eventId);
        await this.requireEventOwner(event, accountId);

        if (ticket.status === TicketStatus.CANCELED) {
            throw new ConflictException("Ticket is already canceled");
        }

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(
                Ticket,
                { id: ticketId },
                { status: TicketStatus.CANCELED }
            );
            await queryRunner.manager.update(
                UserTicket,
                { ticketId },
                { status: UserTicketStatus.CANCELED }
            );
            await queryRunner.manager.update(
                PromoCode,
                { ticketId },
                { status: PromoCodeStatus.CANCELED }
            );
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        ticket.status = TicketStatus.CANCELED;
        return ticket;
    }

    async createPromoCode(
        ticketId: string,
        accountId: string,
        dto: PromoCodeCreateAttributes
    ) {
        const ticket = await this.getTicketById(ticketId);
        if (ticket.status === TicketStatus.CANCELED) {
            throw new ConflictException("Cannot create promo code for a canceled ticket");
        }
        const event = await this.getEvent(ticket.eventId);
        await this.requireEventOwner(event, accountId);
        await this.requireCompanyBilling(event.companyId);

        const existing = await PromoCode.findOneBy({ code: dto.code });
        if (existing) throw new ConflictException("Promo code already exists");

        const promo = PromoCode.create({
            ticketId,
            code: dto.code,
            discountPercent: dto.discount_percent,
            total: dto.total,
            used: 0
        });
        await promo.save();
        return promo;
    }

    async getPromoCodeById(codeId: string): Promise<PromoCode> {
        const promo = await PromoCode.findOneBy({ id: codeId });
        if (!promo) throw new NotFoundException("Promo code not found");
        return promo;
    }

    async getPromoCodes(accountId: string, query: PromoCodeQuery): Promise<[PromoCode[], number]> {
        if (!query.ticket_id && !query.event_id) {
            throw new BadRequestException("Either ticket_id or event_id query param is required");
        }

        const qb = database.dataSource.manager
            .createQueryBuilder(PromoCode, "promo");

        if (query.ticket_id) {
            const ticket = await this.getTicketById(query.ticket_id);
            const event = await this.getEvent(ticket.eventId);
            await this.requireEventOwner(event, accountId);
            qb.andWhere("promo.ticketId = :ticketId", { ticketId: query.ticket_id });
        }

        if (query.event_id) {
            const event = await this.getEvent(query.event_id);
            await this.requireEventOwner(event, accountId);
            qb.innerJoin("promo.ticket", "ticket")
                .andWhere("ticket.eventId = :eventId", { eventId: query.event_id });
        }

        if (query.code) {
            qb.andWhere("promo.code ILIKE :code", { code: `%${query.code}%` });
        }

        if (query.available) {
            qb.andWhere("promo.used < promo.total");
        }

        const statuses = query.status?.length ? query.status : [PromoCodeStatus.ACTIVE];
        qb.andWhere("promo.status IN (:...statuses)", { statuses });

        const promoSortColumn: Record<string, string> = {
            created_at: "promo.createdAt",
            discount_percent: "promo.discountPercent"
        };
        const sortRaw = query.sort ?? "created_at";
        const desc = sortRaw.startsWith("-");
        const field = sortRaw.replace(/^-/, "");
        qb.orderBy(promoSortColumn[field], desc ? "DESC" : "ASC");

        qb.skip(query["page[offset]"]).take(query["page[limit]"]);

        return qb.getManyAndCount();
    }

    async updatePromoCode(
        codeId: string,
        accountId: string,
        dto: PromoCodeUpdateAttributes
    ) {
        const promo = await PromoCode.findOneBy({ id: codeId });
        if (!promo) throw new NotFoundException("Promo code not found");

        const ticket = await this.getTicketById(promo.ticketId);
        const event = await this.getEvent(ticket.eventId);
        await this.requireEventOwner(event, accountId);

        if (dto.total < promo.used) {
            throw new ConflictException(
                `Total cannot be less than already used (${promo.used})`
            );
        }

        promo.total = dto.total;

        await promo.save();
        await promo.reload();
        return promo;
    }

    async cancelPromoCode(codeId: string, accountId: string): Promise<PromoCode> {
        const promo = await PromoCode.findOneBy({ id: codeId });
        if (!promo) throw new NotFoundException("Promo code not found");

        const ticket = await this.getTicketById(promo.ticketId);
        const event = await this.getEvent(ticket.eventId);
        await this.requireEventOwner(event, accountId);

        if (promo.status === PromoCodeStatus.CANCELED) {
            throw new ConflictException("Promo code is already canceled");
        }

        promo.status = PromoCodeStatus.CANCELED;
        await promo.save();
        await promo.reload();
        return promo;
    }

    // ──────────────────────────────
    // Helpers
    // ──────────────────────────────

    async getEvent(eventId: string): Promise<EventEntity> {
        const event = await EventEntity.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException("Event not found");
        return event;
    }

    private async requireEventOwner(
        event: EventEntity,
        accountId: string
    ): Promise<void> {
        const member = await CompanyMember.findOne({
            where: {
                companyId: event.companyId,
                accountId,
                role: CompanyMemberRole.OWNER
            }
        });
        if (!member)
            throw new ForbiddenException(
                "You don't have required permissions for this event"
            );
    }

    private async requireCompanyBilling(companyId: string): Promise<void> {
        const billing = await CompanyBilling.findOneBy({ companyId });
        if (!billing)
            throw new ConflictException("Company billing is not set up");
    }
}
