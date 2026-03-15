import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Generated,
    PrimaryColumn,
    BaseEntity,
    OneToMany
} from "typeorm";
import { CompanyMember } from "./company.member.entity";

@Entity({ name: "companies" })
export class Company extends BaseEntity {
    @PrimaryColumn()
    @Generated("uuid")
    id: string;

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

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt: Date;

    @OneToMany(() => CompanyMember, (cm) => cm.company)
    companyMembers: CompanyMember[];
}
