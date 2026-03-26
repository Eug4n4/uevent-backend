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
import { EventEntity } from "./event.entity";
import { Account } from "./account.entity";
import { PromoCode } from "./promo_code.entity";
import { Transaction } from "./transaction.entity";

export enum TicketStatus {
    ACTIVE = "active",
    CANCELED = "canceled"
}

@Entity({ name: "tickets" })
export class Ticket extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId: string;

    @Column({ length: 255 })
    name: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    description: string | null;

    @Column({ type: "double precision" })
    price: number;

    @Column({
        type: "enum",
        enum: TicketStatus,
        enumName: "ticket_status",
        default: TicketStatus.ACTIVE
    })
    status: TicketStatus;

    @Column({ type: "integer" })
    total: number;

    @Column({ type: "integer", default: 0 })
    sold: number;

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

    @ManyToOne(() => EventEntity)
    @JoinColumn({ name: "event_id" })
    event: EventEntity;
}

export enum UserTicketStatus {
    UNUSED = "unused",
    USED = "used",
    CANCELED = "canceled"
}

@Entity({ name: "user_tickets" })
export class UserTicket extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "account_id", type: "uuid" })
    accountId: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId: string;

    @Column({ name: "promo_code_id", type: "uuid", nullable: true })
    promoCodeId: string | null;

    @Column({ name: "transaction_id", type: "uuid" })
    transactionId: string;

    @Column({
        type: "enum",
        enum: UserTicketStatus,
        enumName: "user_ticket_status",
        default: UserTicketStatus.UNUSED
    })
    status: UserTicketStatus;

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

    @ManyToOne(() => Account)
    @JoinColumn({ name: "account_id" })
    account: Account;

    @ManyToOne(() => Ticket)
    @JoinColumn({ name: "ticket_id" })
    ticket: Ticket;

    @ManyToOne(() => PromoCode, { nullable: true })
    @JoinColumn({ name: "promo_code_id" })
    promoCode: PromoCode | null;

    @ManyToOne(() => Transaction)
    @JoinColumn({ name: "transaction_id" })
    transaction: Transaction;
}
