import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { EventDetails, EventQuery, EventUpdateDetails, PageQuery } from "./event.dto";
import { EventEntity } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";
import { CompanyMember, CompanyMemberRole } from "src/db/entity/company_member.entity";
import { database } from "src/db/data-source";
import { In, SelectQueryBuilder } from "typeorm";
import { EventSub } from "src/db/entity/event_subs.entity";
import { Profile } from "src/db/entity/profile.entity";
import { CompanyService } from "../company/company.service";
import { S3Service } from "../shared/s3.uploader";

@Injectable()
export class EventService {
    constructor(
        private companyService: CompanyService,
        private s3Service: S3Service
    ) {}

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
            .innerJoin(
                CompanyMember,
                "cm",
                "cm.company_id = events.company_id AND cm.account_id = :id",
                { id: accountId }
            )
            .leftJoin("events.tags", "tag");

        return this.getPaginatedAndCount(qb, query);
    }

    async create(dto: EventDetails, userId: string) {
        await this.companyService.getById(dto.company_id);
        await this.companyService.requireCompanyRole(dto.company_id, userId, [
            CompanyMemberRole.OWNER
        ]);

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
            where: { id: eventId },
            relations: { tags: true }
        });
        if (event === null) {
            throw new NotFoundException(
                `Can't find event with id = ${eventId}`
            );
        }
        await this.companyService.requireCompanyRole(
            event.companyId,
            accountId,
            [CompanyMemberRole.OWNER]
        );

        if (dto.company_id && dto.company_id !== event.companyId) {
            await this.companyService.getById(dto.company_id);
            await this.companyService.requireCompanyRole(
                dto.company_id,
                accountId,
                [CompanyMemberRole.OWNER]
            );
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
            Object.assign(event, Object.fromEntries(Object.entries(camelCase).filter(([, v]) => v !== undefined)));
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

    async remove(eventId: string, accountId: string) {
        const event = await EventEntity.findOneBy({ id: eventId });
        if (event === null) {
            throw new NotFoundException(
                `Event with id ${eventId} doesn't exist`
            );
        }
        await this.companyService.requireCompanyRole(
            event.companyId,
            accountId,
            [CompanyMemberRole.OWNER]
        );
        return event.softRemove();
    }

    async uploadAvatar(
        eventId: string,
        accountId: string,
        file: Express.Multer.File
    ): Promise<EventEntity> {
        const event = await this.getById(eventId);
        await this.companyService.requireCompanyRole(event.companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        if (event.avatarKey) await this.s3Service.deleteObject(event.avatarKey);
        const avatarKey = `event/${eventId}/avatar_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, avatarKey);
        event.avatarKey = avatarKey;
        await event.save();
        return event;
    }

    async uploadBanner(
        eventId: string,
        accountId: string,
        file: Express.Multer.File
    ): Promise<EventEntity> {
        const event = await this.getById(eventId);
        await this.companyService.requireCompanyRole(event.companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        if (event.bannerKey) await this.s3Service.deleteObject(event.bannerKey);
        const bannerKey = `event/${eventId}/banner_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, bannerKey);
        event.bannerKey = bannerKey;
        await event.save();
        return event;
    }

    async getSubscribers(
        eventId: string,
        query: PageQuery
    ): Promise<[Profile[], number]> {
        await this.getById(eventId);
        const [subs, total] = await database.dataSource.manager.findAndCount(
            EventSub,
            {
                where: { eventId },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            }
        );
        if (subs.length === 0) return [[], total];
        const profiles = await Profile.findBy({
            accountId: In(subs.map((s) => s.accountId))
        });
        return [profiles, total];
    }

    async subscribe(eventId: string, accountId: string): Promise<Profile> {
        await this.getById(eventId);
        const existing = await EventSub.findOneBy({ accountId, eventId });
        if (existing) {
            throw new BadRequestException("Already subscribed to this event");
        }
        await EventSub.save({ accountId, eventId });
        return Profile.findOneBy({ accountId }) as Promise<Profile>;
    }

    async unsubscribe(eventId: string, accountId: string) {
        await this.getById(eventId);
        const subscriber = await EventSub.findOneBy({ accountId, eventId });
        if (subscriber === null) {
            throw new BadRequestException(
                "Trying to unsubscribe when not subscribed"
            );
        }
        await EventSub.delete({ accountId, eventId });
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
