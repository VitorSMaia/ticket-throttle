import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    event_name!: string;

    @Column({ type: 'varchar', default: 'AVAILABLE' }) // AVAILABLE, RESERVED, SOLD
    status!: string;

    @Column({ type: 'varchar', nullable: true })
    userId!: string;

    @Column({ type: 'timestamp', nullable: true })
    reservedAt!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}