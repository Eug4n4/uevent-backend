import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    OneToMany,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { EventEntity } from "./event.entity";
import { Account } from "./account.entity";

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

@Entity({ name: "company_subs" })
export class CompanySub extends BaseEntity {
    @PrimaryColumn({ name: "account_id", type: "uuid" })
    accountId: string;

    @PrimaryColumn({ name: "company_id", type: "uuid" })
    companyId: string;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamp with time zone"
    })
    createdAt: Date;

    @ManyToOne(() => Account)
    @JoinColumn({ name: "account_id" })
    account: Account;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;
}

export enum CompanyMemberRole {
    OWNER = "owner",
    ADMIN = "admin",
    MODER = "moder"
}

@Entity({ name: "company_members" })
export class CompanyMember extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "account_id", type: "uuid" })
    accountId: string;

    @Column({ name: "company_id", type: "uuid" })
    companyId: string;

    @Column({
        type: "enum",
        enum: CompanyMemberRole,
        enumName: "company_roles",
        default: CompanyMemberRole.MODER
    })
    role: CompanyMemberRole;

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

    @ManyToOne(() => Account)
    @JoinColumn({ name: "account_id" })
    account: Account;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;
}

@Entity({ name: "company_billings" })
export class CompanyBilling extends BaseEntity {
    @PrimaryColumn({ name: "company_id", type: "uuid" })
    companyId: string;

    @Column({ name: "stripe_account_id", length: 255, unique: true })
    stripeAccountId: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp with time zone"})
    createdAt: Date;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;
}
