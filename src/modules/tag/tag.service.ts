import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { DataSource, ILike } from "typeorm";
import { Tag } from "src/db/entity/tag.entity";
import { TagAttributes, TagQuery, TagUpdateAttributes } from "./tag.dto";

@Injectable()
export class TagService {
    constructor(private dataSource: DataSource) {}

    async getAll(query: TagQuery): Promise<[Tag[], number]> {
        return this.dataSource.manager.findAndCount(Tag, {
            where: query.name ? { name: ILike(`%${query.name}%`) } : {},
            order: { name: "ASC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async getById(id: string) {
        const tag = await Tag.findOneBy({ id });
        if (!tag) {
            throw new NotFoundException("Tag not found");
        }
        return tag;
    }

    async create(dto: TagAttributes) {
        const existing = await Tag.findOneBy({ name: dto.name });
        if (existing) {
            throw new BadRequestException("Tag with this name already exists");
        }
        const tag = Tag.create({ ...dto });
        await tag.save();
        return tag;
    }

    async update(id: string, dto: TagUpdateAttributes) {
        const tag = await this.getById(id);
        if (dto.name && dto.name !== tag.name) {
            const existing = await Tag.findOneBy({ name: dto.name });
            if (existing) {
                throw new BadRequestException(
                    "Tag with this name already exists"
                );
            }
        }
        Object.assign(tag, dto);
        await tag.save();
        return tag;
    }

    async remove(id: string) {
        const tag = await this.getById(id);
        await tag.remove();
    }
}
