import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    PrimaryColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Account } from "./account.entity";
import { Company } from "./company.entity";

@Entity({ name: "company_members" })
export class CompanyMember extends BaseEntity {
    @PrimaryColumn("uuid", { name: "account_id" })
    accountId: string;

    @PrimaryColumn("uuid", { name: "company_id" })
    companyId: string;

    @Column({ default: false })
    isOwner: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt: Date;

    @ManyToOne(() => Account, (account) => account.companyMembers)
    @JoinColumn({ name: "account_id" })
    member: Account;

    @ManyToOne(() => Company, (company) => company.companyMembers)
    @JoinColumn({ name: "company_id" })
    company: Company;
}
