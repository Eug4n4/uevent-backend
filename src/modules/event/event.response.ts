import { EventEntity } from "src/db/entity/event.entity";
import { EventQuery, PageQuery } from "./event.dto";
import { Profile } from "src/db/entity/profile.entity";
import { buildFileUrl, stripNulls } from "../shared/s3.uploader";
import { Tag } from "src/db/entity/tag.entity";
import { Company } from "src/db/entity/company.entity";

export const eventData = (event: EventEntity) => ({
    id: event.id,
    type: "event",
    attributes: stripNulls({
        title: event.title,
        text: event.text,
        avatar_url: buildFileUrl(event.avatarKey),
        banner_url: buildFileUrl(event.bannerKey),
        format: event.format,
        publish_at: event.publishAt,
        start_at: event.startAt,
        end_at: event.endAt
    }),
    relationships: stripNulls({
        company: {
            data: { id: event.companyId, type: "company" }
        },
        tags: event.tags?.length
            ? { data: event.tags.map((t) => ({ id: t.id, type: "tag" })) }
            : null
    })
});

const formatTag = (tag: Tag) => ({
    id: tag.id,
    type: "tag",
    attributes: stripNulls({
        name: tag.name,
        description: tag.description ?? null
    })
});

const formatCompany = (company: Company) => ({
    id: company.id,
    type: "company",
    attributes: stripNulls({
        name: company.name,
        email: company.email,
        address: company.address,
        avatar_url: buildFileUrl(company.avatarKey),
        banner_url: buildFileUrl(company.bannerKey)
    })
});

const buildIncluded = (events: EventEntity[], includes: Set<string>) => {
    const result: object[] = [];

    if (includes.has("tags")) {
        const seen = new Map<string, Tag>();
        for (const event of events) {
            for (const tag of event.tags ?? []) {
                if (!seen.has(tag.id)) seen.set(tag.id, tag);
            }
        }
        for (const tag of seen.values()) result.push(formatTag(tag));
    }

    if (includes.has("companies")) {
        const seen = new Map<string, Company>();
        for (const event of events) {
            if (event.company && !seen.has(event.company.id)) {
                seen.set(event.company.id, event.company);
            }
        }
        for (const company of seen.values()) result.push(formatCompany(company));
    }

    return result.length > 0 ? result : undefined;
};

const subscriberData = (profile: Profile) => ({
    id: profile.accountId,
    type: "profile",
    attributes: stripNulls({
        username: profile.username,
        avatar_url: buildFileUrl(profile.avatarKey)
    })
});

export const eventResponse = (event: EventEntity, includes: Set<string> = new Set()) => {
    const included = buildIncluded([event], includes);
    return stripNulls({ data: eventData(event), included });
};

export const paginatedEvents = (
    events: EventEntity[],
    query: EventQuery,
    total: number,
    baseUrl: string,
    includes: Set<string> = new Set()
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const querySort = query.sort ? `&sort=${query.sort}` : "";
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}${querySort}`;
    const included = buildIncluded(events, includes);
    return stripNulls({
        data: events.map(eventData),
        included,
        links: stripNulls({
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev: currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next:
                currentPage < lastPage
                    ? pageParams((currentPage + 1) * limit)
                    : null
        })
    });
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
