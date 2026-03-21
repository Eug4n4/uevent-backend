import { EventEntity } from "src/db/entity/event.entity";
import { EventQuery } from "./event.dto";
import { EventSub } from "src/db/entity/event_subs.entity";

const eventData = (event: EventEntity) => {
    return {
        id: event.id,
        type: "event",
        attributes: {
            title: event.title,
            description: event.description,
            avatar: event.avatar,
            banner: event.banner,
            format: event.format,
            publish_at: event.publishAt,
            start_at: event.startAt,
            end_at: event.endAt
        }
    };
};

const subscriberData = (subscriber: EventSub) => {
    return {
        id: subscriber.id,
        type: "event-sub",
        attributes: {
            account_id: subscriber.accountId,
            event_id: subscriber.eventId,
            created_at: subscriber.createdAt
        }
    };
};

export const subscriberResponse = (subscriber: EventSub) => {
    return {
        data: subscriberData(subscriber)
    };
};

export const eventResponse = (event: EventEntity) => {
    return {
        data: eventData(event)
    };
};

export const collectionEventsResponse = (events: EventEntity[]) => {
    const arr: ReturnType<typeof eventData>[] = [];
    for (const event of events) {
        arr.push(eventData(event));
    }
    return {
        data: arr
    };
};

export const paginatedEvents = (
    events: EventEntity[],
    query: EventQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const querySort = query.sort ? `&sort=${query.sort}` : "";
    const pageParams = (offset: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${offset}${querySort}`;
    return {
        data: events.map(eventData),
        links: {
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev:
                currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next:
                currentPage < lastPage
                    ? pageParams((currentPage + 1) * limit)
                    : null
        }
    };
};
