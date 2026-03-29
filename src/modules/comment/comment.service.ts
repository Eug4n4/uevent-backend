import { Injectable } from "@nestjs/common";
import { CommentQuery } from "./comment.dto";
import { database } from "src/db/data-source";
import { EventComment } from "src/db/entity/event.entity";
import { In } from "typeorm";

@Injectable()
export class CommentService {
    async getAll(query: CommentQuery, eventId: string) {
        const parents = await database.dataSource.manager
            .createQueryBuilder(EventComment, "comments")
            .where("comments.event_id = :id", { id: eventId })
            .andWhere("comments.parent is null")
            .take(query["page[limit]"])
            .offset(query["page[offset]"])
            .getMany();
        const children = await Promise.all(
            parents.map((parent) =>
                database.dataSource.manager
                    .getTreeRepository(EventComment)
                    .findDescendantsTree(parent, { relations: ["profile"] })
            )
        );
        return children;
    }
}
