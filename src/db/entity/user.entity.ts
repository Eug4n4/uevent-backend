import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Generated,
    PrimaryColumn
} from "typeorm";

export type UserRole = "admin" | "user";

@Entity({ name: "users" })
export class User {
    @PrimaryColumn()
    @Generated("uuid")
    id: string;

    @Column({ unique: true, length: 256 })
    email: string;

    @Column({ type: "char", length: 30 })
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
