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
            .leftJoin("events.tags", "tag");

        if (params.tag) {
            qb.where("tag.name IN (:...tagNames)", { tagNames: params.tag });
        }
        if (params.format) {
            qb.andWhere("LOWER(events.format::text) = :format", {
                format: params.format.toLowerCase()
            });
        }
        let order: "ASC" | "DESC" = "ASC";
        if (params.sort && params.sort.length > 0) {
            if (params.sort.startsWith("-")) {
                params.sort = params.sort.slice(1);
                order = "DESC";
            }
            qb.orderBy(params.sort, order);
        }

        qb.limit(params["page[limit]"]);
        qb.offset(params["page[offset]"]);
        return qb.getManyAndCount();
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
                await queryRunner.manager.save(Tag, tags);
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
}
