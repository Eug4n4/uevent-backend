import { Ticket } from "src/db/entity/ticket.entity";
import { PromoCode } from "src/db/entity/promo_code.entity";
import { PromoCodeQuery, TicketQuery } from "./ticket.dto";
import { stripNulls } from "../shared/s3.uploader";

export const ticketData = (ticket: Ticket) =>
    stripNulls({
        id: ticket.id,
        type: "ticket",
        attributes: stripNulls({
            name: ticket.name,
            description: ticket.description ?? null,
            price: ticket.price,
            status: ticket.status,
            total: ticket.total,
            sold: ticket.sold,
            available: ticket.total - ticket.sold,
            created_at: ticket.createdAt,
            updated_at: ticket.updatedAt
        }),
        relationships: stripNulls({
            ticket: {
                data: {
                    id: ticket.eventId,
                    type: "event"
                }
            }
        })
    });

export const ticketResponse = (ticket: Ticket) => ({
    data: ticketData(ticket)
});

export const paginatedTickets = (
    tickets: Ticket[],
    query: TicketQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const url = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}`;
    return stripNulls({
        data: tickets.map(ticketData),
        links: stripNulls({
            self: url(offset),
            first: url(0),
            last: url(lastPage * limit),
            prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
        })
    });
};

export const promoCodeData = (promo: PromoCode) =>
    stripNulls({
        id: promo.id,
        type: "promo_code",
        attributes: stripNulls({
            code: promo.code,
            discount_percent: promo.discountPercent,
            status: promo.status,
            total: promo.total,
            used: promo.used,
            remaining: promo.total - promo.used,
            created_at: promo.createdAt,
            updated_at: promo.updatedAt
        }),
        relationships: stripNulls({
            ticket: {
                data: {
                    id: promo.ticketId,
                    type: "ticket"
                }
            },
        })
    });

export const promoCodeResponse = (promo: PromoCode) => ({
    data: promoCodeData(promo)
});

export const paginatedPromoCodes = (
    promos: PromoCode[],
    query: PromoCodeQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const url = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}`;
    return stripNulls({
        data: promos.map(promoCodeData),
        links: stripNulls({
            self: url(offset),
            first: url(0),
            last: url(lastPage * limit),
            prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
        })
    });
};
