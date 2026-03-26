import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { ILike } from "typeorm";
import { database } from "src/db/data-source";
import { Tag } from "src/db/entity/tag.entity";
import { CompanyMember } from "src/db/entity/company.entity";
import { TagAttributes, TagQuery, TagUpdateAttributes } from "./tag.dto";
import { EventEntity } from "src/db/entity/event.entity";

@Injectable()
export class TagService {
    async getAll(query: TagQuery, include?: string): Promise<[Tag[], number, Map<string, EventEntity[]>]> {
        const [tags, total] = await database.dataSource.manager.findAndCount(Tag, {
            where: query.name ? { name: ILike(`%${query.name}%`) } : {},
            order: { name: "ASC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });

        const eventsMap = new Map<string, EventEntity[]>();
        if (include === "events" && tags.length > 0) {
            for (const tag of tags) {
                eventsMap.set(tag.id, await this.getEventsForTag(tag.id));
            }
        }

        return [tags, total, eventsMap];
    }

    async getById(id: string, include?: string): Promise<[Tag, EventEntity[]]> {
        const tag = await Tag.findOneBy({ id });
        if (!tag) {
            throw new NotFoundException("Tag not found");
        }
        const events = include === "events" ? await this.getEventsForTag(id) : [];
        return [tag, events];
    }

    private async getEventsForTag(tagId: string): Promise<EventEntity[]> {
        return database.dataSource.manager
            .createQueryBuilder(EventEntity, "event")
            .innerJoin("event.tags", "filterTag", "filterTag.id = :tagId", { tagId })
            .leftJoinAndSelect("event.tags", "tag")
            .where("event.publish_at <= current_timestamp")
            .getMany();
    }

    private async requireCompanyMember(userId: string) {
        const member = await CompanyMember.findOneBy({ accountId: userId });
        if (!member) {
            throw new ForbiddenException(
                "You must be a member of at least one company"
            );
        }
    }

    async create(dto: TagAttributes, userId: string) {
        await this.requireCompanyMember(userId);
        const existing = await Tag.findOneBy({ name: dto.name });
        if (existing) {
            throw new ConflictException("Tag with this name already exists");
        }
        const tag = Tag.create({ ...dto });
        await tag.save();
        return tag;
    }

    async update(id: string, dto: TagUpdateAttributes, userId: string) {
        await this.requireCompanyMember(userId);
        const [tag] = await this.getById(id);
        if (dto.name && dto.name !== tag.name) {
            const existing = await Tag.findOneBy({ name: dto.name });
            if (existing) {
                throw new BadRequestException(
                    "Tag with this name already exists"
                );
            }
        }
        Object.assign(
            tag,
            Object.fromEntries(
                Object.entries(dto).filter(([, v]) => v !== undefined)
            )
        );
        await tag.save();
        return tag;
    }

    async delete(id: string) {
        const [tag] = await this.getById(id);
        await tag.remove();
    }
}
