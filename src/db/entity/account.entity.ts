import type { UserRole } from "src/modules/auth/auth.types";
import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Generated,
    PrimaryColumn,
    BaseEntity
} from "typeorm";

@Entity({ name: "accounts" })
export class Account extends BaseEntity {
    @PrimaryColumn()
    @Generated("uuid")
    id: string;

    @Column({ unique: true, length: 256 })
    email: string;

    @Column({ length: 256, nullable: true })
    password: string;

    @Column({ type: "enum", enum: ["admin", "user"], default: "user" })
    role: UserRole;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt: Date;
}
