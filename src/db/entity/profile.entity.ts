import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    PrimaryColumn,
    Generated
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "profiles" })
export class Profile {
    @PrimaryColumn({ name: "user_id" })
    @Generated("uuid")
    userId: string;

    @Column({ length: 30 })
    username: string;

    @Column({ length: 255 })
    avatar: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;
}
