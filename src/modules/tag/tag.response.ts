import { Tag } from "src/db/entity/tag.entity";
import { TagQuery } from "./tag.dto";

const tagData = (tag: Tag) => ({
    id: tag.id,
    type: "tag",
    attributes: {
        name: tag.name,
        description: tag.description ?? null
    }
});

export const tagResponse = (tag: Tag) => ({ data: tagData(tag) });

export const paginatedTags = (
    tags: Tag[],
    query: TagQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const nameParam = query.name ? `&name=${query.name}` : "";
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}${nameParam}`;

    return {
        data: tags.map(tagData),
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
