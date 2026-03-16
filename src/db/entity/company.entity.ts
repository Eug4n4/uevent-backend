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
import { CompanyMember } from "./company.member.entity";
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

    // relations

    @OneToMany(() => CompanyMember, (cm) => cm.company)
    companyMembers: CompanyMember[];

    @OneToMany(() => EventEntity, (event) => event.company)
    events: EventEntity[];
}
