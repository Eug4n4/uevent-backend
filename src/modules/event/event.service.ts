import { Injectable } from "@nestjs/common";
import { EventDetails } from "./event.dto";
import { EventEntity } from "src/db/entity/event.entity";
import { Tag } from "src/db/entity/tag.entity";

@Injectable()
export class EventService {
    async create(dto: EventDetails) {
        const event = EventEntity.create({
            ...dto,
            tags: undefined
        });
        if (dto.included && dto.included.length > 0) {
            const tags: Tag[] = [];
            for (const tag of dto.included) {
                tags.push(
                    Tag.create({
                        name: tag.attributes.name,
                        description: tag.attributes.description
                    })
                );
            }
            await Tag.save(tags);
            event.tags = tags;
        }
        await event.save();
        return event;
    }
}
