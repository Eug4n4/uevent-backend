import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    PrimaryGeneratedColumn,
    PrimaryColumn
} from "typeorm";
import { Company } from "./company.entity";
import { Tag } from "./tag.entity";
import { Account } from "./account.entity";

export const eventFormats = ["Lection", "Workshop", "Concert", "Meeting"];

export enum EventStatus {
    ACTIVE = "active",
    CANCELED = "canceled"
}

@Entity({ name: "events" })
export class EventEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "company_id", type: "uuid" })
    companyId: string;

    @Column({
        type: "enum",
        enum: EventStatus,
        enumName: "event_status",
        default: EventStatus.ACTIVE
    })
    status: EventStatus;

    @Column({ length: 255 })
    title: string;

    @Column({ type: "text", nullable: true })
    text: string | null;

    @Column({
        name: "avatar_key",
        type: "varchar",
        length: 255,
        nullable: true
    })
    avatarKey: string | null;

    @Column({
        name: "banner_key",
        type: "varchar",
        length: 255,
        nullable: true
    })
    bannerKey: string | null;

    @Column({
        type: "enum",
        enum: eventFormats,
        enumName: "event_format_enum"
    })
    format: string;

    @Column({
        name: "publish_at",
        type: "timestamp with time zone"
    })
    publishAt: Date;

    @Column({
        name: "start_at",
        type: "timestamp with time zone"
    })
    startAt: Date;

    @Column({
        name: "end_at",
        type: "timestamp with time zone"
    })
    endAt: Date;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamp with time zone"
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamp with time zone"
    })
    updatedAt: Date;

    // relations
    @ManyToOne(() => Company, (company) => company.events)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @ManyToMany(() => Tag)
    @JoinTable({
        name: "event_tags",
        joinColumn: { name: "event_id" },
        inverseJoinColumn: { name: "tag_id" }
    })
    tags: Tag[];
}

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
