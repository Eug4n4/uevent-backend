import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

export enum TransactionStatus {
    PENDING = "pending",
    PAID = "paid",
    RETURNED = "returned",
}

@Entity({ name: "transactions" })
export class Transaction extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "account_id", type: "uuid" })
    accountId: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId: string;

    @Column({ name: "payment_intent_id", type: "varchar", nullable: true })
    paymentIntentId: string | null;

    @Column({
        type: "enum",
        enum: TransactionStatus,
        enumName: "transaction_status",
        default: TransactionStatus.PENDING
    })
    status: TransactionStatus;

    @Column({ length: 1024 })
    description: string;

    @Column({ name: "final_price", type: "integer" })
    finalPrice: number;

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
