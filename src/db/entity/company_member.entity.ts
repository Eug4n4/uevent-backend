import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Account } from "./account.entity";
import { Company } from "./company.entity";

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
