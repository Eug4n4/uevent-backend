import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { EventEntity } from "./event.entity";

@Entity({ name: "companies" })
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 255 })
    address: string;

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

    @OneToMany(() => EventEntity, (event) => event.company)
    events: EventEntity[];
}
