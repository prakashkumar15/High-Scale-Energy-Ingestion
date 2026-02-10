import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('meter_readings')
@Index(['chargerId', 'timestamp'])
export class MeterReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'charger_id' })
  chargerId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'kwh_consumed_ac' })
  kwhConsumedAc!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  voltage!: number;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
