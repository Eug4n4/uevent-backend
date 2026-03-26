import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    BaseEntity,
    PrimaryColumn
} from "typeorm";
import { Account } from "./account.entity";

@Entity({ name: "profiles" })
export class Profile extends BaseEntity {
    @PrimaryColumn("uuid", { name: "account_id" })
    accountId: string;

    @Column({ length: 30 })
    username: string;

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
}
