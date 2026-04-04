import { UserTicket } from "src/db/entity/ticket.entity";
import { Transaction } from "src/db/entity/transaction.entity";
import { TransactionQuery, UserTicketPageQuery } from "./payment.dto";
import { stripNulls } from "../shared/s3.uploader";

export const userTicketData = (ut: UserTicket) =>
    stripNulls({
        id: ut.id,
        type: "user_ticket",
        attributes: stripNulls({
            status: ut.status,
            created_at: ut.createdAt,
            updated_at: ut.updatedAt
        }),
        relationships: stripNulls({
            account: { data: { id: ut.accountId, type: "account" } },
            ticket: { data: { id: ut.ticketId, type: "ticket" } },
            promo_code: ut.promoCodeId
                ? { data: { id: ut.promoCodeId, type: "promo_code" } }
                : null,
            transaction: { data: { id: ut.transactionId, type: "transaction" } }
        })
    });

export const userTicketResponse = (ut: UserTicket) => ({
    data: userTicketData(ut)
});

export const transactionData = (t: Transaction) => ({
    id: t.id,
    type: "transaction",
    attributes: {
        status: t.status,
        description: t.description,
        final_price: t.finalPrice,
        check: t.check,
        created_at: t.createdAt,
        updated_at: t.updatedAt
    }
});

export const transactionResponse = (t: Transaction) => ({
    data: transactionData(t)
});

export const paginatedTransactions = (
    transactions: Transaction[],
    query: TransactionQuery,
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
        data: transactions.map(transactionData),
        links: stripNulls({
            self: url(offset),
            first: url(0),
            last: url(lastPage * limit),
            prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
        })
    });
};

export const paginatedUserTickets = (
    uts: UserTicket[],
    query: UserTicketPageQuery,
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
        data: uts.map(userTicketData),
        links: stripNulls({
            self: url(offset),
            first: url(0),
            last: url(lastPage * limit),
            prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
        })
    });
};
