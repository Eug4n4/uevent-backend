import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Ticket } from "./ticket.entity";

export enum PromoCodeStatus {
    ACTIVE = "active",
    CANCELED = "canceled"
}

@Entity({ name: "promo_codes" })
export class PromoCode extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId: string;

    @Column({ length: 50, unique: true })
    code: string;

    @Column({ name: "discount_percent", type: "integer" })
    discountPercent: number;

    @Column({
        type: "enum",
        enum: PromoCodeStatus,
        enumName: "promo_code_status",
        default: PromoCodeStatus.ACTIVE
    })
    status: PromoCodeStatus;

    @Column({ type: "integer" })
    total: number;

    @Column({ type: "integer", default: 0 })
    used: number;

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

    @ManyToOne(() => Ticket)
    @JoinColumn({ name: "ticket_id" })
    ticket: Ticket;
}
