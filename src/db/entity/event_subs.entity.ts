import {
    Entity,
    CreateDateColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    PrimaryColumn
} from "typeorm";
import { Account } from "./account.entity";
import { EventEntity } from "./event.entity";

@Entity({ name: "event_subs" })
export class EventSub extends BaseEntity {
    @PrimaryColumn({ name: "account_id", type: "uuid" })
    accountId: string;

    @PrimaryColumn({ name: "event_id", type: "uuid" })
    eventId: string;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamp with time zone"
    })
    createdAt: Date;

    @ManyToOne(() => Account)
    @JoinColumn({ name: "account_id" })
    account: Account;

    @ManyToOne(() => EventEntity)
    @JoinColumn({ name: "event_id" })
    event: EventEntity;
}
