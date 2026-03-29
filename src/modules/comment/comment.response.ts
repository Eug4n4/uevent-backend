import { EventComment } from "src/db/entity/event.entity";
import { CommentQuery } from "./comment.dto";
import { stripNulls } from "../shared/s3.uploader";
import { profileData } from "../profile/profile.response";

const commentRelationships = (comment: EventComment) => {
    const profile = {
        data: {
            type: "profile",
            id: comment.profileId
        }
    };
    if (comment.children && comment.children.length > 0) {
        return {
            profile: profile,
            children: {
                data: comment.children.map((child) => {
                    return {
                        id: child.id,
                        type: "comment"
                    };
                })
            }
        };
    }
    return {
        profile: profile
    };
};

const collectIncluded = (
    comment: EventComment,
    includedMap: Map<string, any>
) => {
    if (!includedMap.has(comment.id)) {
        includedMap.set(comment.id, {
            ...commentData(comment),
            relationships: commentRelationships(comment)
        });
    }

    if (!includedMap.has(comment.profileId)) {
        includedMap.set(comment.profileId, profileData(comment.profile));
    }

    for (const child of comment.children) {
        collectIncluded(child, includedMap);
    }
};

const commentData = (comment: EventComment) => {
    return {
        id: comment.id,
        type: "comment",
        attributes: stripNulls({
            text: comment.text,
            created_at: comment.createdAt,
            updated_at: comment.updatedAt,
            deleted_at: comment.deletedAt
        })
    };
};

const commentIncludes = (comments: EventComment[]) => {
    const includedMap = new Map<string, any>();

    for (const root of comments) {
        for (const child of root.children) {
            collectIncluded(child, includedMap);
        }
    }

    return Array.from(includedMap.values());
};

export const commentResponse = (comment: EventComment) => {
    return {
        data: {
            ...commentData(comment),
            relationships: commentRelationships(comment)
        }
    };
};

export const paginatedComments = (
    comments: EventComment[],
    query: CommentQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}`;
    return stripNulls({
        data: comments.map((comment) => {
            return {
                ...commentData(comment),
                relationships: commentRelationships(comment)
            };
        }),
        included: commentIncludes(comments),
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
    });
};
