import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicle_current_status')
export class VehicleCurrentStatus {
  @PrimaryColumn({ name: 'vehicle_id' })
  vehicleId!: string;

  @Column({ name: 'charger_id' })
  chargerId!: string;

  @Column({ type: 'int' })
  soc!: number;

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
  timestamp!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
