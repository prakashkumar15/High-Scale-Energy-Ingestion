import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('charger_current_status')
export class ChargerCurrentStatus {
  @PrimaryColumn({ name: 'meter_id' })
  meterId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'kwh_consumed_ac' })
  kwhConsumedAc!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  voltage!: number;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
