import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('vehicle_readings')
@Index(['vehicleId', 'timestamp'])
@Index(['chargerId', 'timestamp'])
export class VehicleReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id' })
  vehicleId!: string;

  @Column({ name: 'charger_id' })
  chargerId!: string;

  @Column({ type: 'int' })
  soc!: number; // State of Charge (%)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'kwh_delivered_dc',
  })
  kwhDeliveredDc!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'battery_temp' })
  batteryTemp!: number;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
