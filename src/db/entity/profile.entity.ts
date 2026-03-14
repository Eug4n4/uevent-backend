import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    PrimaryColumn,
    Generated,
    BaseEntity
} from "typeorm";
import { Account } from "./account.entity";

@Entity({ name: "profiles" })
export class Profile extends BaseEntity {
    @PrimaryColumn({ name: "account_id" })
    @Generated("uuid")
    accountId: string;

    @Column({ length: 30 })
    username: string;

    @Column({ length: 255, default: "default.png" })
    avatar: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToOne(() => Account, { onDelete: "CASCADE" })
    @JoinColumn({ name: "account_id" })
    account: Account;
}
