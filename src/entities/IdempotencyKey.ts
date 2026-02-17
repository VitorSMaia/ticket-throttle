import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKey {
    @PrimaryColumn({ type: 'varchar' })
    key!: string; // O token único enviado pelo Front ou gerado no clique

    @Column({ type: 'jsonb' })
    response_body: any; // Cache da resposta anterior

    @Column({ type: 'integer' })
    status_code!: number;

    @CreateDateColumn()
    created_at!: Date;
}
