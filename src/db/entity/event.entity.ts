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
    PrimaryColumn,
    DeleteDateColumn,
    OneToMany,
    Tree,
    TreeParent,
    TreeChildren
} from "typeorm";
import { Company } from "./company.entity";
import { Tag } from "./tag.entity";
import { Account } from "./account.entity";
import { Profile } from "./profile.entity";
import { GeoPoint, pointTransformer } from "src/modules/shared/geo";

export const eventFormats = ["Lection", "Workshop", "Concert", "Meeting"];

export enum EventStatus {
    ACTIVE = "active",
    CANCELED = "canceled"
}

export enum VisitorsVisibility {
    EVERYONE = "everyone",
    STAFF_ONLY = "staff_only",
    STAFF_AND_VISITORS = "staff_and_visitors"
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
        name: "banner_key",
        type: "varchar",
        length: 255,
        nullable: true
    })
    bannerKey: string | null;

    @Column({
        type: "geography",
        spatialFeatureType: "Point",
        srid: 4326,
        nullable: true,
        transformer: pointTransformer
    })
    location: GeoPoint | null;

    @Column({
        type: "enum",
        enum: eventFormats,
        enumName: "event_format_enum"
    })
    format: string;

    @Column({ name: "notification_new_tickets", type: "boolean", default: false })
    notificationNewTickets: boolean;

    @Column({
        name: "visitors_visibility",
        type: "enum",
        enum: VisitorsVisibility,
        enumName: "visitors_visibility_enum",
        default: VisitorsVisibility.EVERYONE
    })
    visitorsVisibility: VisitorsVisibility;

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

    @OneToMany(() => EventComment, (comment) => comment.event)
    comments: EventComment[];
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

@Entity({ name: "event_comments" })
@Tree("materialized-path")
export class EventComment extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    text: string;

    @Column({ type: "uuid", name: "event_id" })
    eventId: string;

    @Column({ type: "uuid", name: "profile_id" })
    profileId: string;

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

    @DeleteDateColumn({
        name: "deleted_at",
        type: "timestamp with time zone"
    })
    deletedAt: Date;

    // relations

    @TreeParent()
    @JoinColumn({ name: "parent_id" })
    parent: EventComment;

    @TreeChildren()
    children: EventComment[];

    @ManyToOne(() => EventEntity, (event) => event.comments)
    @JoinColumn({ name: "event_id" })
    event: EventEntity;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile: Profile;
}
