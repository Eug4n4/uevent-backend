import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { EventDetails } from "./event.dto";
import { EventEntity } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";

@Injectable()
export class EventService {
    constructor(private dataSource: DataSource) {}

    async create(dto: EventDetails) {
        const queryRunner = this.dataSource.createQueryRunner();
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
