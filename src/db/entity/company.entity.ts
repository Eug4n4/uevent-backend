import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { EventEntity } from "./event.entity";
import { Account } from "./account.entity";

@Entity({ name: "companies" })
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 255 })
    address: string;

    @Column({ length: 255, default: "default.png" })
    avatar: string;

    @Column({ length: 255, default: "default.png" })
    banner: string;

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

    @ManyToOne(() => Account)
    @JoinColumn({ name: "owner_id" })
    owner: Account;

    @OneToMany(() => EventEntity, (event) => event.company)
    events: EventEntity[];
}
