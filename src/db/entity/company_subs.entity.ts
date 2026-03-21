import {
    Entity,
    Column,
    CreateDateColumn,
    BaseEntity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique
} from "typeorm";
import { Company } from "./company.entity";
import { Account } from "./account.entity";

@Entity({ name: "company_subs" })
@Unique(["accountId", "companyId"])
export class CompanySub extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "account_id", type: "uuid" })
    accountId: string;

    @Column({ name: "company_id", type: "uuid" })
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
