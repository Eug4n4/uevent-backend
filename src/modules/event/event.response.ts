import { EventEntity } from "src/db/entity/event.entity";
import { EventQuery, PageQuery } from "./event.dto";
import { Profile } from "src/db/entity/profile.entity";
import { buildFileUrl, stripNulls } from "../shared/s3.uploader";

const eventData = (event: EventEntity) => {
    return {
        id: event.id,
        type: "event",
        attributes: stripNulls({
            title: event.title,
            description: event.description,
            avatar_url: buildFileUrl(event.avatarKey),
            banner_url: buildFileUrl(event.bannerKey),
            format: event.format,
            publish_at: event.publishAt,
            start_at: event.startAt,
            end_at: event.endAt
        })
    };
};

const subscriberData = (profile: Profile) => ({
    id: profile.accountId,
    type: "profile",
    attributes: stripNulls({ username: profile.username, avatar_url: buildFileUrl(profile.avatarKey) })
});

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
        links: stripNulls({
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev:
                currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next:
                currentPage < lastPage
                    ? pageParams((currentPage + 1) * limit)
                    : null
        })
    };
};

export const paginatedEventSubscribers = (
    profiles: Profile[],
    query: PageQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const url = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}`;
    return {
        data: profiles.map(subscriberData),
        links: stripNulls({
            self: url(offset),
            first: url(0),
            last: url(lastPage * limit),
            prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
        })
    };
};
