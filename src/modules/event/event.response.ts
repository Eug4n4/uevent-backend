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
            publish_at: event.publishAt,
            start_at: event.startAt,
            end_at: event.endAt
        }
    };
};

export const eventResponse = (event: EventEntity) => {
    return {
        data: eventData(event)
    };
};
