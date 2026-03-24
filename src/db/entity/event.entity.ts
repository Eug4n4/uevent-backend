import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    PrimaryGeneratedColumn
} from "typeorm";
import { Company } from "./company.entity";
import { Tag } from "./tag.entity";

export const eventFormats = ["Lection", "Workshop", "Concert", "Meeting"];

@Entity({ name: "events" })
export class EventEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "company_id", type: "uuid" })
    companyId: string;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 1024 })
    description: string;

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

    @DeleteDateColumn({
        name: "deleted_at",
        nullable: true,
        type: "timestamp with time zone"
    })
    deletedAt: Date;

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
