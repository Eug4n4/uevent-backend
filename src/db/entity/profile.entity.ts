import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn
} from "typeorm";
import { Account } from "./account.entity";
import { EventComment } from "./event.entity";

@Entity({ name: "profiles" })
export class Profile extends BaseEntity {
    @PrimaryColumn("uuid", { name: "account_id" })
    accountId: string;

    @Column({ length: 30 })
    username: string;

    @Column({ type: "boolean", default: true })
    visibility: boolean;

    @Column({
        name: "avatar_key",
        length: 255,
        nullable: true,
        type: "varchar"
    })
    avatarKey: string | null;

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

    @OneToOne(() => Account, { onDelete: "CASCADE" })
    @JoinColumn({ name: "account_id" })
    account: Account;

    @OneToMany(() => EventComment, (comment) => comment.profile)
    comments: EventComment[];
}
