import { EventEntity } from "src/db/entity/event.entity";

const eventData = (event: EventEntity) => {
    return {
        id: event.id,
        type: "event",
        attributes: {
            title: event.title,
            description: event.description,
            avatar: event.avatar,
            banner: event.banner,
            publishAt: event.publishAt,
            startAt: event.startAt,
            endAt: event.endAt
        }
    };
};
export const eventResponse = (event: EventEntity) => {
    return {
        data: eventData(event)
    };
};
