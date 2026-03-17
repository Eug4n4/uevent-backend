import { EventEntity } from "src/db/entity/event.entity";
import { EventQuery } from "./event.dto";

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

export const eventResponse = (event: EventEntity) => {
    return {
        data: eventData(event)
    };
};

export const manyEventsResponse = (events: EventEntity[]) => {
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
    const querySort = `sort=${query.sort}`;
    return {
        data: events.map(eventData),
        links: {
            self: `${baseUrl}?page[limit]=${limit}&page[offset]=${offset}&${querySort}`,
            first: `${baseUrl}?page[limit]=${limit}&page[offset]=0&${querySort}`,
            last: `${baseUrl}?page[limit]=${limit}&page[offset]=${lastPage * limit}&${querySort}`,
            prev:
                currentPage > 0
                    ? `${baseUrl}?page[limit]=${limit}&page[offset]=${(currentPage - 1) * limit}&${querySort}`
                    : null,
            next:
                currentPage < lastPage
                    ? `${baseUrl}?page[limit]=${limit}&page[offset]=${(currentPage + 1) * limit}&${querySort}`
                    : null
        }
    };
};
