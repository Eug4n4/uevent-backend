import { Tag } from "src/db/entity/tag.entity";
import { TagQuery } from "./tag.dto";
import { stripNulls } from "../shared/s3.uploader";
import { EventEntity } from "src/db/entity/event.entity";
import { eventData } from "../event/event.response";

const tagData = (tag: Tag, events?: EventEntity[]) => ({
    id: tag.id,
    type: "tag",
    attributes: stripNulls({
        name: tag.name,
        description: tag.description ?? null
    }),
    ...(events !== undefined
        ? {
              relationships: {
                  events: {
                      data: events.map((e) => eventData(e))
                  }
              }
          }
        : {})
});

export const tagResponse = (tag: Tag, events?: EventEntity[]) => ({
    data: tagData(tag, events)
});

export const paginatedTags = (
    tags: Tag[],
    query: TagQuery,
    total: number,
    baseUrl: string,
    eventsMap?: Map<string, EventEntity[]>
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const nameParam = query.name ? `&name=${query.name}` : "";
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}${nameParam}`;

    return {
        data: tags.map((tag) =>
            tagData(tag, eventsMap?.get(tag.id))
        ),
        links: stripNulls({
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev: currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? pageParams((currentPage + 1) * limit) : null
        })
    };
};
