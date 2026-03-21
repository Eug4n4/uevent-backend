import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { EventDetails, EventQuery, EventUpdateDetails } from "./event.dto";
import { EventEntity } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";
import { Company } from "src/db/entity/company.entity";
import { database } from "src/db/data-source";
import { In, SelectQueryBuilder } from "typeorm";

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
        const company = await Company.findOneBy({ id: dto.company_id });
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
                companyId: dto.company_id,
                title: dto.title,
                description: dto.description,
                notificationNewTicket: dto.notification_new_ticket,
                publishAt: dto.publish_at,
                startAt: dto.start_at,
                endAt: dto.end_at,
                format: dto.format
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

    async update(dto: EventUpdateDetails, accountId: string, eventId: string) {
        const event = await EventEntity.findOne({
            where: { id: eventId, company: { ownerId: accountId } },
            relations: { tags: true }
        });
        if (event === null) {
            throw new NotFoundException(
                `Can't find event with id = ${eventId}`
            );
        }
        let company: Company | null = null;
        if (dto.company_id) {
            company = await Company.findOneBy({
                id: dto.company_id,
                ownerId: accountId
            });
            if (company === null) {
                throw new NotFoundException(
                    `Can't find company with id = ${dto.company_id}`
                );
            }
        }
        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const camelCase = {
            title: dto.title,
            description: dto.description,
            notificationNewTicket: dto.notification_new_ticket,
            publishAt: dto.publish_at,
            startAt: dto.start_at,
            endAt: dto.end_at,
            format: dto.format,
            companyId: dto.company_id
        };
        try {
            Object.assign(event, camelCase);
            let tags: Tag[] = [];
            if (dto.included && dto.included.length > 0) {
                for (const tagData of dto.included) {
                    tags.push(
                        queryRunner.manager.create(Tag, tagData.attributes)
                    );
                }

                await queryRunner.manager.upsert(Tag, tags, {
                    conflictPaths: ["name"],
                    skipUpdateIfNoValuesChanged: true
                });
                tags = await queryRunner.manager.find(Tag, {
                    where: { name: In(tags.map((t) => t.name)) }
                });
            }
            event.tags = tags;
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
