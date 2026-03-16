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

@Entity({ name: "events" })
export class EventEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "company_id", type: "uuid" })
    companyId: string;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 255 })
    description: string;

    @Column({ length: 255, default: "default.png" })
    avatar: string;

    @Column({ length: 255, default: "default.png" })
    banner: string;

    @Column({
        type: "enum",
        enum: ["Lection", "Travel", "Sport", "Party", "Art", "Gaming"]
    })
    format: string;

    @Column({ default: false, name: "notification_new_ticket" })
    notificationNewTicket: boolean;

    @Column({ name: "publish_at" })
    publishAt: Date;

    @Column({ name: "start_at" })
    startAt: Date;

    @Column({ name: "end_at" })
    endAt: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
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
