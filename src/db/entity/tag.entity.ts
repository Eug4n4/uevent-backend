import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity({ name: "tags" })
export class Tag extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 50, unique: true })
    name: string;

    @Column({ length: 255, nullable: true })
    description?: string;

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
}
