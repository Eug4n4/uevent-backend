import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { Ticket, TicketStatus, UserTicket, UserTicketStatus } from "src/db/entity/ticket.entity";
import { PromoCode, PromoCodeStatus } from "src/db/entity/promo_code.entity";
import {
    EventDetails,
    EventQuery,
    EventUpdateDetails,
    PageQuery,
    VisitorsQuery
} from "./event.dto";
import { EventEntity, EventStatus, VisitorsVisibility } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";
import { CompanyMember, CompanyMemberRole } from "src/db/entity/company.entity";
import { database } from "src/db/data-source";
import { In, SelectQueryBuilder } from "typeorm";
import { EventSub } from "src/db/entity/event.entity";
import { Profile } from "src/db/entity/profile.entity";
import { CompanyService } from "../company/company.service";
import { S3Service } from "../shared/s3.uploader";
import { MailService } from "../mail/mail.service";

@Injectable()
export class EventService {
    constructor(
        private companyService: CompanyService,
        private s3Service: S3Service,
        private mail: MailService
    ) {}

    async create(dto: EventDetails, userId: string) {
        await this.companyService.getById(dto.company_id);
        await this.companyService.requireCompanyRole(dto.company_id, userId, [
            CompanyMemberRole.OWNER
        ]);

        const now = new Date();
        const publishAt = !dto.publish_at || new Date(dto.publish_at) < now ? now : new Date(dto.publish_at);

        this.validateEventDates(
            publishAt,
            new Date(dto.start_at),
            new Date(dto.end_at)
        );

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const event = queryRunner.manager.create(EventEntity, {
                companyId: dto.company_id,
                title: dto.title,
                text: dto.text ?? null,
                publishAt,
                startAt: dto.start_at,
                endAt: dto.end_at,
                format: dto.format,
                location: dto.location ?? null,
                notificationNewTickets: dto.notification_new_tickets ?? false,
                visitorsVisibility: dto.visitors_visibility ?? VisitorsVisibility.EVERYONE
            });

            event.tags =
                dto.tagIds && dto.tagIds.length > 0
                    ? await queryRunner.manager.find(Tag, {
                          where: { id: In(dto.tagIds) }
                      })
                    : [];

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

    async getById(id: string, userId?: string, includes: Set<string> = new Set()) {
        const event = await EventEntity.findOne({
            where: { id },
            relations: { tags: true, company: includes.has("companies") }
        });
        if (event === null) {
            throw new NotFoundException(`Can't find event with id = ${id}`);
        }

        const isPublished = event.publishAt <= new Date();
        if (!isPublished) {
            const isMember = userId
                ? !!(await CompanyMember.findOneBy({
                      companyId: event.companyId,
                      accountId: userId
                  }))
                : false;
            if (!isMember) {
                throw new NotFoundException(`Can't find event with id = ${id}`);
            }
        }
        return event;
    }

    async getAll(params: EventQuery, userId?: string, includes: Set<string> = new Set()) {
        const qb = database.dataSource.manager
            .createQueryBuilder(EventEntity, "events")
            .leftJoinAndSelect("events.tags", "tag");

        if (includes.has("companies")) {
            qb.leftJoinAndSelect("events.company", "company");
        }

        const isMember =
            params.company_id && userId
                ? !!(await CompanyMember.findOneBy({
                      companyId: params.company_id,
                      accountId: userId
                  }))
                : false;

        const wantsPublished =
            !params.published || params.published.includes(true);
        const wantsUnpublished = params.published?.includes(false) ?? false;

        if (wantsPublished && wantsUnpublished && isMember) {
            // Company member requesting both → no publish_at filter
        } else if (wantsUnpublished && !wantsPublished && isMember) {
            qb.where("events.publish_at > current_timestamp");
        } else {
            qb.where("events.publish_at <= current_timestamp");
        }

        if (params.status && params.status.length > 0) {
            qb.andWhere("events.status IN (:...statuses)", {
                statuses: params.status
            });
        } else {
            qb.andWhere("events.status = :defaultStatus", {
                defaultStatus: EventStatus.ACTIVE
            });
        }

        if (params.text) {
            qb.andWhere(
                "(events.title ILIKE :text OR events.text ILIKE :text)",
                { text: `%${params.text}%` }
            );
        }

        if (params.company_id) {
            qb.andWhere("events.company_id = :companyId", {
                companyId: params.company_id
            });
        }

        if (params.tag_id && params.tag_id.length > 0) {
            qb.andWhere("tag.id IN (:...tagIds)", { tagIds: params.tag_id });
        }

        if (params.subscribed_by_user) {
            qb.innerJoin(
                "event_subs",
                "sub",
                "sub.event_id = events.id AND sub.account_id = :subUserId",
                { subUserId: params.subscribed_by_user }
            );
        }

        const { near_lat, near_lng, near_radius_m } = params;
        const nearCount = [near_lat, near_lng, near_radius_m].filter((v) => v !== undefined).length;
        if (nearCount > 0 && nearCount < 3) {
            throw new BadRequestException(
                "near_lat, near_lng, and near_radius_m must all be provided together"
            );
        }
        if (nearCount === 3) {
            qb.andWhere(
                "ST_DWithin(events.location::geography, ST_MakePoint(:near_lng, :near_lat)::geography, :near_radius_m)",
                { near_lat, near_lng, near_radius_m }
            );
        }

        return this.getPaginatedAndCount(qb, params);
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

        const now = new Date();
        const resolvedPublishAt = dto.publish_at
            ? new Date(dto.publish_at) < now ? now : new Date(dto.publish_at)
            : undefined;

        this.validateEventDates(
            resolvedPublishAt ?? event.publishAt,
            new Date(dto.start_at ?? event.startAt),
            new Date(dto.end_at ?? event.endAt)
        );

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const camelCase = {
            title: dto.title,
            text: dto.text,
            publishAt: resolvedPublishAt,
            startAt: dto.start_at,
            endAt: dto.end_at,
            format: dto.format,
            companyId: dto.company_id,
            notificationNewTickets: dto.notification_new_tickets,
            visitorsVisibility: dto.visitors_visibility
        };
        try {
            Object.assign(
                event,
                Object.fromEntries(
                    Object.entries(camelCase).filter(([, v]) => v !== undefined)
                )
            );
            await queryRunner.manager.save(event);
            if (dto.location !== undefined) {
                await queryRunner.query(
                    `UPDATE events SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
                    [dto.location.longitude, dto.location.latitude, eventId]
                );
                event.location = dto.location;
            }
            await queryRunner.commitTransaction();
            return event;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async cancelEvent(eventId: string, accountId: string): Promise<EventEntity> {
        const event = await EventEntity.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException(`Event with id ${eventId} doesn't exist`);

        if (event.status === EventStatus.CANCELED)
            throw new ConflictException("Event is already canceled");

        await this.companyService.requireCompanyRole(
            event.companyId,
            accountId,
            [CompanyMemberRole.OWNER]
        );

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1. Mark the event as canceled
            await queryRunner.manager.update(EventEntity, { id: eventId }, {
                status: EventStatus.CANCELED
            });

            // 2. Collect all ticket IDs for this event so we can cancel UserTickets
            const tickets = await queryRunner.manager.find(Ticket, {
                where: { eventId },
                select: { id: true }
            });

            // 3. Cancel all ticket types for this event
            if (tickets.length > 0) {
                const ticketIds = tickets.map((t) => t.id);

                await queryRunner.manager.update(
                    Ticket,
                    { eventId },
                    { status: TicketStatus.CANCELED }
                );

                // 4. Cancel all promo codes for those tickets
                await queryRunner.manager.update(
                    PromoCode,
                    { ticketId: In(ticketIds) },
                    { status: PromoCodeStatus.CANCELED }
                );

                // 5. Cancel all purchased user tickets linked to those ticket types
                await queryRunner.manager.update(
                    UserTicket,
                    { ticketId: In(ticketIds) },
                    { status: UserTicketStatus.CANCELED }
                );
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        event.status = EventStatus.CANCELED;
        void this.mail.eventCanceled(eventId);
        return event;
    }

    async uploadBanner(
        eventId: string,
        accountId: string,
        file: Express.Multer.File
    ): Promise<EventEntity> {
        const event = await this.getById(eventId, accountId);
        await this.companyService.requireCompanyRole(
            event.companyId,
            accountId,
            [CompanyMemberRole.OWNER]
        );
        if (event.bannerKey) await this.s3Service.deleteObject(event.bannerKey);
        const bannerKey = `event/${eventId}/banner_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, bannerKey);
        event.bannerKey = bannerKey;
        await event.save();
        return event;
    }

    async getSubscribers(
        eventId: string,
        query: PageQuery,
        userId?: string
    ): Promise<[Profile[], number]> {
        await this.getById(eventId, userId);
        return database.dataSource.manager
            .createQueryBuilder(Profile, "profile")
            .innerJoin(
                EventSub,
                "sub",
                "sub.account_id = profile.account_id AND sub.event_id = :eventId",
                { eventId }
            )
            .orderBy("sub.created_at", "ASC")
            .limit(query["page[limit]"])
            .offset(query["page[offset]"])
            .getManyAndCount();
    }

    async getVisitors(
        eventId: string,
        query: VisitorsQuery,
        userId?: string
    ): Promise<[Profile[], number]> {
        const event = await EventEntity.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException(`Can't find event with id = ${eventId}`);

        const ticketsVisibility: boolean[] =
            query.tickets_visibility ?? [true];

        const wantsHidden = ticketsVisibility.includes(false);

        const isMember = userId
            ? !!(await CompanyMember.findOneBy({
                  companyId: event.companyId,
                  accountId: userId
              }))
            : false;

        // Only company members can request hidden-ticket visitors
        if (wantsHidden && !isMember) {
            throw new ForbiddenException(
                "Only company members can view hidden-ticket visitors"
            );
        }

        // Non-members are subject to the event's visitors_visibility setting
        if (!isMember) {
            if (event.visitorsVisibility === VisitorsVisibility.STAFF_ONLY) {
                throw new ForbiddenException(
                    "Visitor list is restricted to company staff"
                );
            }
            if (event.visitorsVisibility === VisitorsVisibility.STAFF_AND_VISITORS) {
                const hasTicket = userId
                    ? !!(await database.dataSource.manager
                          .createQueryBuilder(UserTicket, "ut")
                          .innerJoin(Ticket, "t", "t.id = ut.ticket_id")
                          .where("t.event_id = :eventId", { eventId })
                          .andWhere("ut.account_id = :userId", { userId })
                          .getOne())
                    : false;
                if (!hasTicket) {
                    throw new ForbiddenException(
                        "Only ticket holders or company staff can view the visitor list"
                    );
                }
            }
        }

        const qb = database.dataSource.manager
            .createQueryBuilder(Profile, "profile")
            .innerJoin(UserTicket, "ut", "ut.account_id = profile.account_id")
            .innerJoin(Ticket, "t", "t.id = ut.ticket_id")
            .where("t.event_id = :eventId", { eventId })
            .andWhere("ut.visibility IN (:...visibilities)", {
                visibilities: ticketsVisibility
            })
            .orderBy("ut.created_at", "ASC");

        const total = await qb.getCount();
        const profiles = await qb
            .limit(query["page[limit]"])
            .offset(query["page[offset]"])
            .getMany();

        return [profiles, total];
    }

    async subscribe(eventId: string, accountId: string): Promise<Profile> {
        await this.getById(eventId, accountId); // ensure event is visible to the caller
        const existing = await EventSub.findOneBy({ accountId, eventId });
        if (existing) {
            throw new ConflictException("Already subscribed to this event");
        }
        await EventSub.save({ accountId, eventId });
        return Profile.findOneBy({ accountId }) as Promise<Profile>;
    }

    async unsubscribe(eventId: string, accountId: string) {
        await this.getById(eventId, accountId);
        const subscriber = await EventSub.findOneBy({ accountId, eventId });
        if (subscriber === null) {
            throw new ConflictException("Not subscribed to this event");
        }
        await EventSub.delete({ accountId, eventId });
    }

    async setTags(eventId: string, tagIds: string[], userId: string) {
        const event = await EventEntity.findOne({
            where: { id: eventId },
            relations: { tags: true }
        });
        if (!event)
            throw new NotFoundException(
                `Can't find event with id = ${eventId}`
            );
        await this.companyService.requireCompanyRole(event.companyId, userId, [
            CompanyMemberRole.OWNER
        ]);
        event.tags =
            tagIds.length > 0 ? await Tag.findBy({ id: In(tagIds) }) : [];
        await event.save();
        return event;
    }

    async addTag(eventId: string, tagId: string, userId: string) {
        const event = await EventEntity.findOne({
            where: { id: eventId },
            relations: { tags: true }
        });
        if (!event)
            throw new NotFoundException(
                `Can't find event with id = ${eventId}`
            );
        await this.companyService.requireCompanyRole(event.companyId, userId, [
            CompanyMemberRole.OWNER
        ]);
        if (event.tags.some((t) => t.id === tagId)) {
            throw new ConflictException("Tag already attached to this event");
        }
        const tag = await Tag.findOneBy({ id: tagId });
        if (!tag)
            throw new NotFoundException(`Can't find tag with id = ${tagId}`);
        event.tags.push(tag);
        await event.save();
        return event;
    }

    async removeTag(eventId: string, tagId: string, userId: string) {
        const event = await EventEntity.findOne({
            where: { id: eventId },
            relations: { tags: true }
        });
        if (!event)
            throw new NotFoundException(
                `Can't find event with id = ${eventId}`
            );
        await this.companyService.requireCompanyRole(event.companyId, userId, [
            CompanyMemberRole.OWNER
        ]);
        if (!event.tags.some((t) => t.id === tagId)) {
            throw new ConflictException("Tag is not attached to this event");
        }
        event.tags = event.tags.filter((t) => t.id !== tagId);
        await event.save();
    }

    private validateEventDates(publishAt: Date, startAt: Date, endAt: Date) {
        if (publishAt >= startAt) {
            throw new BadRequestException("publish_at must be before start_at");
        }
        if (startAt >= endAt) {
            throw new BadRequestException("start_at must be before end_at");
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

        if (query.start_after) {
            queryBuilder.andWhere("events.start_at >= :startAfter", {
                startAfter: query.start_after
            });
        }
        if (query.start_before) {
            queryBuilder.andWhere("events.start_at <= :startBefore", {
                startBefore: query.start_before
            });
        }

        if (query.end_after) {
            queryBuilder.andWhere("events.end_at >= :endAfter", {
                endAfter: query.end_after
            });
        }
        if (query.end_before) {
            queryBuilder.andWhere("events.end_at <= :endBefore", {
                endBefore: query.end_before
            });
        }

        if (query.format && query.format.length > 0) {
            queryBuilder.andWhere("events.format IN (:...formats)", {
                formats: query.format
            });
        }
        const sortingOptions = {
            start_at: "events.startAt",
            end_at: "events.endAt",
            publish_at: "events.publishAt"
        }

        let order: "ASC" | "DESC" = "ASC";
        if (query.sort && query.sort.length > 0) {
            if (query.sort.startsWith("-")) {
                query.sort = query.sort.slice(1);
                order = "DESC";
            }
            queryBuilder.orderBy(sortingOptions[query.sort], order);
        }

        queryBuilder.take(query["page[limit]"]);
        queryBuilder.skip(query["page[offset]"]);
        return queryBuilder.getManyAndCount();
    }
}
