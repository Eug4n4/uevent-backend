import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { EventDetails, EventQuery } from "./event.dto";
import { EventEntity } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";
import { Company } from "src/db/entity/company.entity";
import { database } from "src/db/data-source";
import { SelectQueryBuilder } from "typeorm";

@Injectable()
export class EventService {
    async getById(id: string) {
        const event = await EventEntity.findOneBy({ id });
        if (event === null) {
            throw new NotFoundException(`Can't find event with id = ${id}`);
        }

        return event;
    }

    async getAll(params: EventQuery) {
        const qb = database.dataSource.manager
            .createQueryBuilder(EventEntity, "events")
            .leftJoin("events.tags", "tag")
            .where("events.publish_at <= current_timestamp");

        return this.getPaginatedAndCount(qb, params);
    }

    async getMy(accountId: string, query: EventQuery) {
        const qb = database.dataSource.manager
            .createQueryBuilder(EventEntity, "events")
            .leftJoin(Company, "companies")
            .where("companies.ownerId = :id", { id: accountId })
            .leftJoin("events.tags", "tag");

        return this.getPaginatedAndCount(qb, query);
    }

    async create(dto: EventDetails, userId: string) {
        const company = await Company.findOneBy({ id: dto.companyId });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        if (company.ownerId !== userId) {
            throw new ForbiddenException(
                "Only company owner can create events"
            );
        }

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const event = queryRunner.manager.create(EventEntity, {
                ...dto,
                tags: undefined
            });

            if (dto.included && dto.included.length > 0) {
                const tags = dto.included.map((tag) =>
                    queryRunner.manager.create(Tag, {
                        name: tag.attributes.name,
                        description: tag.attributes.description
                    })
                );
                await queryRunner.manager.upsert(Tag, tags, {
                    conflictPaths: ["name"],
                    skipUpdateIfNoValuesChanged: true
                });
                event.tags = tags;
            }

            await queryRunner.manager.save(event);
            await queryRunner.commitTransaction();

            return event;
        } catch (err) {
            await queryRunner.rollbackTransaction();

            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private getPaginatedAndCount(
        queryBuilder: SelectQueryBuilder<EventEntity>,
        query: EventQuery
    ) {
        if (query.tag) {
            queryBuilder.andWhere("tag.name IN (:...tagNames)", {
                tagNames: query.tag
            });
        }
        if (query.format) {
            queryBuilder.andWhere("LOWER(events.format::text) = :format", {
                format: query.format.toLowerCase()
            });
        }
        let order: "ASC" | "DESC" = "ASC";
        if (query.sort && query.sort.length > 0) {
            if (query.sort.startsWith("-")) {
                query.sort = query.sort.slice(1);
                order = "DESC";
            }
            queryBuilder.orderBy(query.sort, order);
        }

        queryBuilder.limit(query["page[limit]"]);
        queryBuilder.offset(query["page[offset]"]);
        return queryBuilder.getManyAndCount();
    }
}
