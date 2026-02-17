import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    event_name!: string;

    @Column({ type: 'enum', enum: ['AVAILABLE', 'RESERVED', 'SOLD'], default: 'AVAILABLE' })
    status!: 'AVAILABLE' | 'RESERVED' | 'SOLD';

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price!: number;

    @Column({ type: 'varchar', nullable: true })
    userId!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    reservedAt!: Date | null;

    @UpdateDateColumn()
    updated_at!: Date;
}